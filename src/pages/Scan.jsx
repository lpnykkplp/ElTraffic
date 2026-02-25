import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
    ScanBarcode,
    LogIn,
    LogOut,
    User,
    Smartphone,
    Hash,
    Camera,
    AlertCircle,
    ZoomIn,
    X,
    Briefcase,
} from 'lucide-react';
import {
    getOfficialByBarcode,
    getLastLog,
    addTrafficLog,
    formatDateTime,
} from '../utils/dataStore';

export default function Scan() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const [scannerReady, setScannerReady] = useState(false);
    const [viewingPhoto, setViewingPhoto] = useState(null);

    const startScanner = async () => {
        setError(null);
        setResult(null);
        setScannerReady(true);

        // Wait for DOM to render the visible qr-reader div
        await new Promise((resolve) => setTimeout(resolve, 300));

        try {
            // Clean up any previous instance
            if (scannerRef.current) {
                try {
                    const state = scannerRef.current.getState();
                    if (state === 2) {
                        await scannerRef.current.stop();
                    }
                    scannerRef.current.clear();
                } catch (e) {
                    // ignore cleanup errors
                }
                scannerRef.current = null;
            }

            // Clear the container before re-initializing
            const container = document.getElementById('qr-reader');
            if (container) container.innerHTML = '';

            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    handleScanResult(decodedText);
                    stopScanner();
                },
                () => { }
            );
            setScanning(true);
        } catch (err) {
            console.error('Scanner error:', err);
            setScannerReady(false);
            if (err?.name === 'NotAllowedError') {
                setError('Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.');
            } else if (err?.name === 'NotFoundError') {
                setError('Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.');
            } else if (err?.message?.includes('SSL') || err?.message?.includes('secure')) {
                setError('Kamera membutuhkan koneksi HTTPS. Gunakan HTTPS atau localhost.');
            } else {
                setError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan dan gunakan HTTPS.');
            }
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === 2) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (e) {
                console.error(e);
            }
            scannerRef.current = null;
        }
        setScanning(false);
        setScannerReady(false);
    };

    const handleScanResult = async (barcode) => {
        const official = await getOfficialByBarcode(barcode);
        if (!official) {
            setError(`Barcode "${barcode}" tidak ditemukan dalam sistem.`);
            return;
        }
        const lastLog = await getLastLog(official.id);
        const newType = lastLog && lastLog.type === 'IN' ? 'OUT' : 'IN';
        const log = await addTrafficLog(official.id, newType);
        setResult({ official, log, type: newType });
    };

    const [manualBarcode, setManualBarcode] = useState('');
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualBarcode.trim()) return;
        await handleScanResult(manualBarcode.trim());
        setManualBarcode('');
    };

    useEffect(() => {
        return () => { stopScanner(); };
    }, []);

    return (
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Scanner */}
            <div className="card">
                <div className="feed-header">
                    <h3>
                        <ScanBarcode size={18} color="#6366f1" />
                        Barcode Scanner
                    </h3>
                </div>
                <div style={{ padding: 24 }}>
                    <div
                        id="qr-reader"
                        style={{
                            borderRadius: 14,
                            overflow: 'hidden',
                            marginBottom: (scanning || scannerReady) ? 12 : 0,
                            height: (scanning || scannerReady) ? 'auto' : 0,
                            minHeight: (scanning || scannerReady) ? 280 : 0,
                            transition: 'all 0.3s ease',
                        }}
                    />

                    {!scanning && !scannerReady && !result && (
                        <div style={{ textAlign: 'center', padding: '32px 0' }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: 18,
                                background: '#eef2ff', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', margin: '0 auto 16px'
                            }}>
                                <Camera size={40} color="#6366f1" />
                            </div>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 24 }}>
                                Arahkan kamera ke barcode pejabat untuk memindai
                            </p>
                            <button onClick={startScanner} className="btn btn-primary">
                                Mulai Scan
                            </button>
                        </div>
                    )}

                    {(scanning || scannerReady) && (
                        <button onClick={stopScanner} className="btn btn-secondary btn-full" style={{ marginTop: 8 }}>
                            {scanning ? 'Berhenti Scan' : 'Memuat kamera...'}
                        </button>
                    )}
                </div>
            </div>

            {/* Manual input */}
            {!result && (
                <div className="card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Hash size={16} color="#6366f1" />
                        Input Manual
                    </h3>
                    <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="text"
                            name="manual-barcode"
                            value={manualBarcode}
                            onChange={(e) => setManualBarcode(e.target.value)}
                            placeholder="Masukkan kode barcode..."
                            className="form-input"
                            style={{ flex: 1, fontFamily: "'SF Mono', 'Fira Code', monospace" }}
                        />
                        <button type="submit" className="btn btn-primary">
                            Cari
                        </button>
                    </form>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="animate-slide-up" style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 14, padding: 20, display: 'flex', alignItems: 'flex-start', gap: 12
                }}>
                    <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 500, color: '#b91c1c' }}>{error}</p>
                        <button
                            onClick={() => setError(null)}
                            style={{
                                fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer',
                                background: 'none', border: 'none', marginTop: 4, padding: 0,
                                fontFamily: 'Inter, sans-serif', textDecoration: 'underline'
                            }}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Status banner */}
                    <div className={`status-banner ${result.type === 'IN' ? 'in' : 'out'}`}>
                        <div className="status-banner-icon">
                            {result.type === 'IN' ? <LogIn size={32} /> : <LogOut size={32} />}
                        </div>
                        <h2>{result.type === 'IN' ? 'MASUK' : 'KELUAR'}</h2>
                        <p>{formatDateTime(result.log.timestamp)}</p>
                    </div>

                    {/* Official info */}
                    <div className="card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                            <div
                                onClick={() => result.official.photoUrl && setViewingPhoto({ src: result.official.photoUrl, title: 'Foto Pejabat' })}
                                style={{
                                    width: 64, height: 64, borderRadius: 14,
                                    background: '#f1f5f9', overflow: 'hidden', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: result.official.photoUrl ? 'pointer' : 'default',
                                    position: 'relative'
                                }}
                            >
                                {result.official.photoUrl ? (
                                    <>
                                        <img src={result.official.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{
                                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            opacity: 0, transition: 'opacity 0.2s'
                                        }}
                                            className="photo-hover-overlay"
                                        >
                                            <ZoomIn size={20} color="white" />
                                        </div>
                                    </>
                                ) : (
                                    <User size={32} color="#94a3b8" />
                                )}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                                    {result.official.name}
                                </h3>
                                {result.official.jabatan && (
                                    <p style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Briefcase size={13} />
                                        {result.official.jabatan}
                                    </p>
                                )}
                                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{result.official.phoneBrand}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div className="info-item">
                                <Hash size={16} />
                                <div>
                                    <div className="label">IMEI</div>
                                    <div className="value mono">{result.official.imei}</div>
                                </div>
                            </div>
                            <div className="info-item">
                                <ScanBarcode size={16} />
                                <div>
                                    <div className="label">Barcode</div>
                                    <div className="value accent">{result.official.barcode}</div>
                                </div>
                            </div>
                            {result.official.phonePhotoUrl && (
                                <div style={{ marginTop: 8 }}>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Smartphone size={14} /> Foto HP
                                    </p>
                                    <div
                                        onClick={() => setViewingPhoto({ src: result.official.phonePhotoUrl, title: `Foto HP — ${result.official.name}` })}
                                        style={{ position: 'relative', cursor: 'pointer', borderRadius: 12, overflow: 'hidden' }}
                                    >
                                        <img
                                            src={result.official.phonePhotoUrl}
                                            alt="Phone"
                                            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                                        />
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.4))',
                                            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                                            padding: 12
                                        }}>
                                            <span style={{
                                                fontSize: '0.7rem', color: 'white', fontWeight: 500,
                                                display: 'flex', alignItems: 'center', gap: 4,
                                                background: 'rgba(0,0,0,0.3)', padding: '4px 10px',
                                                borderRadius: 6, backdropFilter: 'blur(4px)'
                                            }}>
                                                <ZoomIn size={12} /> Tap untuk lihat
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => { setResult(null); setError(null); }}
                        className="btn btn-primary btn-full"
                    >
                        <ScanBarcode size={18} />
                        Scan Lagi
                    </button>
                </div>
            )}

            {/* ─── Photo Viewer Modal ─── */}
            {viewingPhoto && (
                <div
                    className="modal-overlay"
                    onClick={() => setViewingPhoto(null)}
                    style={{ zIndex: 1000, background: 'rgba(0,0,0,0.85)', padding: 0 }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'relative', maxWidth: '90vw', maxHeight: '90vh',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
                        }}
                    >
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            width: '100%', padding: '0 4px'
                        }}>
                            <span style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>
                                {viewingPhoto.title}
                            </span>
                            <button
                                onClick={() => setViewingPhoto(null)}
                                style={{
                                    background: 'rgba(255,255,255,0.15)', border: 'none',
                                    borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex'
                                }}
                            >
                                <X size={18} color="white" />
                            </button>
                        </div>
                        <img
                            src={viewingPhoto.src}
                            alt=""
                            style={{
                                maxWidth: '100%', maxHeight: 'calc(90vh - 48px)',
                                objectFit: 'contain', borderRadius: 12,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
