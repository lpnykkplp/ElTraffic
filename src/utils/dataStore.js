// Supabase-based data store for ElTraffic
import { supabase } from './supabaseClient';

// ─── Helper: convert DB row (snake_case) → JS object (camelCase) ───

function toOfficial(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        phoneBrand: row.phone_brand,
        imei: row.imei,
        barcode: row.barcode,
        photoUrl: row.photo_url,
        phonePhotoUrl: row.phone_photo_url,
        createdAt: row.created_at,
    };
}

function toLog(row) {
    if (!row) return null;
    return {
        id: row.id,
        officialId: row.official_id,
        type: row.type,
        timestamp: row.timestamp,
    };
}

// ─── Officials ───

export async function getOfficials() {
    const { data, error } = await supabase
        .from('officials')
        .select('*')
        .order('created_at', { ascending: false });
    if (error) { console.error('getOfficials error:', error); return []; }
    return data.map(toOfficial);
}

export async function getOfficialById(id) {
    const { data, error } = await supabase
        .from('officials')
        .select('*')
        .eq('id', id)
        .single();
    if (error) { console.error('getOfficialById error:', error); return null; }
    return toOfficial(data);
}

export async function getOfficialByBarcode(barcode) {
    const { data, error } = await supabase
        .from('officials')
        .select('*')
        .eq('barcode', barcode)
        .single();
    if (error) { console.error('getOfficialByBarcode error:', error); return null; }
    return toOfficial(data);
}

export async function addOfficial(official) {
    const newRow = {
        name: official.name,
        phone_brand: official.phoneBrand,
        imei: official.imei,
        barcode: generateBarcode(),
        photo_url: official.photoUrl || null,
        phone_photo_url: official.phonePhotoUrl || null,
    };
    const { data, error } = await supabase
        .from('officials')
        .insert(newRow)
        .select()
        .single();
    if (error) { console.error('addOfficial error:', error); return null; }
    return toOfficial(data);
}

export async function updateOfficial(id, updates) {
    const row = {};
    if (updates.name !== undefined) row.name = updates.name;
    if (updates.phoneBrand !== undefined) row.phone_brand = updates.phoneBrand;
    if (updates.imei !== undefined) row.imei = updates.imei;
    if (updates.photoUrl !== undefined) row.photo_url = updates.photoUrl;
    if (updates.phonePhotoUrl !== undefined) row.phone_photo_url = updates.phonePhotoUrl;

    const { data, error } = await supabase
        .from('officials')
        .update(row)
        .eq('id', id)
        .select()
        .single();
    if (error) { console.error('updateOfficial error:', error); return null; }
    return toOfficial(data);
}

export async function deleteOfficial(id) {
    // traffic_logs will cascade delete via FK
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
    if (error) { console.error('getTrafficLogs error:', error); return []; }
    return data.map(toLog);
}

export async function addTrafficLog(officialId, type) {
    const { data, error } = await supabase
        .from('traffic_logs')
        .insert({ official_id: officialId, type })
        .select()
        .single();
    if (error) { console.error('addTrafficLog error:', error); return null; }
    return toLog(data);
}

export async function getLogsByOfficialId(officialId) {
    const { data, error } = await supabase
        .from('traffic_logs')
        .select('*')
        .eq('official_id', officialId)
        .order('timestamp', { ascending: false });
    if (error) { console.error('getLogsByOfficialId error:', error); return []; }
    return data.map(toLog);
}

export async function getLastLog(officialId) {
    const { data, error } = await supabase
        .from('traffic_logs')
        .select('*')
        .eq('official_id', officialId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
    if (error) {
        // PGRST116 = no rows found, not a real error
        if (error.code !== 'PGRST116') console.error('getLastLog error:', error);
        return null;
    }
    return toLog(data);
}

export async function getTodayLogs() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
        .from('traffic_logs')
        .select('*')
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false });
    if (error) { console.error('getTodayLogs error:', error); return []; }
    return data.map(toLog);
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
