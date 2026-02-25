// Supabase-backed data store for ElTraffic
import { supabase } from './supabaseClient';

// ─── Photo Upload Helper ───

async function uploadPhoto(file, folder) {
    if (!file) return '';
    // file is a base64 data URL string
    if (!file.startsWith('data:')) return file; // already a URL

    const base64 = file.split(',')[1];
    const mimeMatch = file.match(/data:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = mime.split('/')[1] || 'jpg';
    const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;

    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mime });

    const { error } = await supabase.storage
        .from('photos')
        .upload(fileName, blob, { contentType: mime, upsert: false });

    if (error) {
        console.error('Upload error:', error);
        return file; // fallback: keep base64
    }

    const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

async function deletePhoto(url) {
    if (!url || !url.includes('/storage/v1/object/public/photos/')) return;
    const path = url.split('/storage/v1/object/public/photos/')[1];
    if (path) {
        await supabase.storage.from('photos').remove([path]);
    }
}

// ─── Officials ───

export async function getOfficials() {
    const { data, error } = await supabase
        .from('officials')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getOfficials error:', error);
        return [];
    }

    // Map DB column names to app field names
    return data.map(mapOfficialFromDB);
}

export async function getOfficialById(id) {
    const { data, error } = await supabase
        .from('officials')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('getOfficialById error:', error);
        return null;
    }

    return mapOfficialFromDB(data);
}

export async function getOfficialByBarcode(barcode) {
    const { data, error } = await supabase
        .from('officials')
        .select('*')
        .eq('barcode', barcode)
        .single();

    if (error) return null;
    return mapOfficialFromDB(data);
}

export async function addOfficial(official) {
    const photoUrl = await uploadPhoto(official.photoUrl, 'officials');
    const phonePhotoUrl = await uploadPhoto(official.phonePhotoUrl, 'phones');

    const newOfficial = {
        name: official.name,
        jabatan: official.jabatan || '',
        phone_brand: official.phoneBrand,
        imei: official.imei,
        barcode: generateBarcode(),
        photo_url: photoUrl,
        phone_photo_url: phonePhotoUrl,
    };

    const { data, error } = await supabase
        .from('officials')
        .insert([newOfficial])
        .select()
        .single();

    if (error) {
        console.error('addOfficial error:', error);
        return null;
    }

    return mapOfficialFromDB(data);
}

export async function updateOfficial(id, updates) {
    // Upload new photos if they are base64
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.jabatan !== undefined) dbUpdates.jabatan = updates.jabatan;
    if (updates.phoneBrand !== undefined) dbUpdates.phone_brand = updates.phoneBrand;
    if (updates.imei !== undefined) dbUpdates.imei = updates.imei;

    if (updates.photoUrl !== undefined) {
        dbUpdates.photo_url = await uploadPhoto(updates.photoUrl, 'officials');
    }
    if (updates.phonePhotoUrl !== undefined) {
        dbUpdates.phone_photo_url = await uploadPhoto(updates.phonePhotoUrl, 'phones');
    }

    const { data, error } = await supabase
        .from('officials')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('updateOfficial error:', error);
        return null;
    }

    return mapOfficialFromDB(data);
}

export async function deleteOfficial(id) {
    // Get official first to delete photos
    const official = await getOfficialById(id);
    if (official) {
        await deletePhoto(official.photoUrl);
        await deletePhoto(official.phonePhotoUrl);
    }

    // Logs are cascade-deleted by the DB
    const { error } = await supabase
        .from('officials')
        .delete()
        .eq('id', id);

    if (error) console.error('deleteOfficial error:', error);
}

// ─── Traffic Logs ───

export async function getTrafficLogs() {
    const { data, error } = await supabase
        .from('traffic_logs')
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('getTrafficLogs error:', error);
        return [];
    }

    return data.map(mapLogFromDB);
}

export async function addTrafficLog(officialId, type) {
    const { data, error } = await supabase
        .from('traffic_logs')
        .insert([{
            official_id: officialId,
            type,
        }])
        .select()
        .single();

    if (error) {
        console.error('addTrafficLog error:', error);
        return null;
    }

    return mapLogFromDB(data);
}

export async function getLogsByOfficialId(officialId) {
    const { data, error } = await supabase
        .from('traffic_logs')
        .select('*')
        .eq('official_id', officialId)
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('getLogsByOfficialId error:', error);
        return [];
    }

    return data.map(mapLogFromDB);
}

export async function getLastLog(officialId) {
    const { data, error } = await supabase
        .from('traffic_logs')
        .select('*')
        .eq('official_id', officialId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

    if (error) return null;
    return mapLogFromDB(data);
}

export async function getTodayLogs() {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
        .from('traffic_logs')
        .select('*')
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`)
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('getTodayLogs error:', error);
        return [];
    }

    return data.map(mapLogFromDB);
}

export async function getStats() {
    const officials = await getOfficials();
    const todayLogs = await getTodayLogs();

    let insideCount = 0;
    for (const o of officials) {
        const lastLog = await getLastLog(o.id);
        if (lastLog && lastLog.type === 'IN') insideCount++;
    }

    return {
        totalOfficials: officials.length,
        insideCount,
        outsideCount: officials.length - insideCount,
        todayScans: todayLogs.length,
    };
}

// ─── DB Field Mapping ───

function mapOfficialFromDB(row) {
    return {
        id: row.id,
        name: row.name,
        jabatan: row.jabatan || '',
        phoneBrand: row.phone_brand,
        imei: row.imei,
        barcode: row.barcode,
        photoUrl: row.photo_url || '',
        phonePhotoUrl: row.phone_photo_url || '',
        createdAt: row.created_at,
    };
}

function mapLogFromDB(row) {
    return {
        id: row.id,
        officialId: row.official_id,
        type: row.type,
        timestamp: row.timestamp,
    };
}

// ─── Helpers ───

function generateBarcode() {
    const prefix = 'ELT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

export function formatDateTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function formatTime(isoString) {
    const d = new Date(isoString);
    return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
