import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    ScanBarcode, LogIn, LogOut, User, Smartphone,
    Hash, Camera, AlertCircle, Loader2,
} from 'lucide-react';
import {
    getOfficialByBarcode, getLastLog, addTrafficLog, formatDateTime,
} from '../utils/dataStore';

export default function Scan() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const scannerRef = useRef(null);

    const startScanner = async () => {
        setError(null); setResult(null);
        try {
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                (decodedText) => { handleScanResult(decodedText); stopScanner(); },
                () => {}
            );
            setScanning(true);
        } catch (err) {
            setError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === 2) await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) { console.error(e); }
            scannerRef.current = null;
        }
        setScanning(false);
    };

    const handleScanResult = async (barcode) => {
        setProcessing(true); setError(null);
        try {
            const official = await getOfficialByBarcode(barcode);
            if (!official) { setError(`Barcode "${barcode}" tidak ditemukan.`); return; }
            const lastLog = await getLastLog(official.id);
            const newType = lastLog && lastLog.type === 'IN' ? 'OUT' : 'IN';
            const log = await addTrafficLog(official.id, newType);
            setResult({ official, log, type: newType });
        } catch (err) {
            setError('Terjadi kesalahan saat memproses scan.');
        } finally { setProcessing(false); }
    };

    const [manualBarcode, setManualBarcode] = useState('');
    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualBarcode.trim()) return;
        handleScanResult(manualBarcode.trim());
        setManualBarcode('');
    };

    useEffect(() => { return () => { stopScanner(); }; }, []);

    return (
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
                <div className="feed-header">
                    <h3><ScanBarcode size={18} color="#6366f1" /> Barcode Scanner</h3>
                </div>
                <div style={{ padding: 24 }}>
                    <div id="qr-reader" style={{ display: scanning ? 'block' : 'none', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }} />
                    {!scanning && !result && !processing && (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <div style={{ width: 80, height: 80, borderRadius: 18, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Camera size={40} color="#6366f1" />
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 24 }}>Arahkan kamera ke barcode pejabat untuk memindai</p>
                            <button onClick={startScanner} className="btn btn-primary">Mulai Scan</button>
                        </div>
                    )}
                    {processing && (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <Loader2 size={32} color="#6366f1" className="spin" />
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 12 }}>Memproses...</p>
                        </div>
                    )}
                    {scanning && (
                        <button onClick={stopScanner} className="btn btn-secondary btn-full" style={{ marginTop: 8 }}>Berhenti Scan</button>
                    )}
                </div>
            </div>

            {!result && !processing && (
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Hash size={16} color="#6366f1" /> Input Manual
                    </h3>
                    <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
                        <input type="text" value={manualBarcode} onChange={(e) => setManualBarcode(e.target.value)} placeholder="Masukkan kode barcode..." className="form-input" style={{ flex: 1, fontFamily: "'SF Mono', 'Fira Code', monospace" }} />
                        <button type="submit" className="btn btn-primary">Cari</button>
                    </form>
                </div>
            )}

            {error && (
                <div className="animate-slide-up" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#b91c1c' }}>{error}</p>
                        <button onClick={() => setError(null)} style={{ fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none', marginTop: 4, padding: 0, fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>Tutup</button>
                    </div>
                </div>
            )}

            {result && (
                <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className={`status-banner ${result.type === 'IN' ? 'in' : 'out'}`}>
                        <div className="status-banner-icon">
                            {result.type === 'IN' ? <LogIn size={32} /> : <LogOut size={32} />}
                        </div>
                        <h2>{result.type === 'IN' ? 'MASUK' : 'KELUAR'}</h2>
                        <p>{formatDateTime(result.log.timestamp)}</p>
                    </div>
                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                            <div style={{ width: 64, height: 64, borderRadius: 14, background: '#f1f5f9', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {result.official.photoUrl ? <img src={result.official.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} color="#94a3b8" />}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>{result.official.name}</h3>
                                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{result.official.phoneBrand}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div className="info-item"><Hash size={16} /><div><div className="label">IMEI</div><div className="value mono">{result.official.imei}</div></div></div>
                            <div className="info-item"><ScanBarcode size={16} /><div><div className="label">Barcode</div><div className="value accent">{result.official.barcode}</div></div></div>
                            {result.official.phonePhotoUrl && (
                                <div style={{ marginTop: 8 }}>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}><Smartphone size={14} /> Foto HP</p>
                                    <img src={result.official.phonePhotoUrl} alt="Phone" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 12 }} />
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={() => { setResult(null); setError(null); }} className="btn btn-primary btn-full">
                        <ScanBarcode size={18} /> Scan Lagi
                    </button>
                </div>
            )}
        </div>
    );
}
