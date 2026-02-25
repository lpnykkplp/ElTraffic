import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
    Users,
    User,
    Search,
    Smartphone,
    Hash,
    ScanBarcode,
    Printer,
    ExternalLink,
    UserX,
    UserPlus,
    Briefcase,
    LogIn,
    LogOut,
} from 'lucide-react';
import { getOfficials, getLastLog, formatDate } from '../utils/dataStore';

export default function OfficialsList() {
    const [officials, setOfficials] = useState([]);
    const [search, setSearch] = useState('');
    const [statuses, setStatuses] = useState({});

    useEffect(() => {
        async function load() {
            const data = await getOfficials();
            setOfficials(data);
            const statusMap = {};
            await Promise.all(data.map(async (o) => {
                const lastLog = await getLastLog(o.id);
                statusMap[o.id] = lastLog ? lastLog.type : null;
            }));
            setStatuses(statusMap);
        }
        load();
    }, []);

    const filtered = officials.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.barcode.toLowerCase().includes(search.toLowerCase()) ||
        o.phoneBrand.toLowerCase().includes(search.toLowerCase())
    );

    // ─── Print ───
    const handlePrint = (official) => {
        const printWindow = window.open('', '_blank', 'width=400,height=500');
        if (!printWindow) return;

        const svgEl = document.getElementById(`qr-${official.id}`);
        const svgData = svgEl ? svgEl.outerHTML : '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code — ${official.name}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Inter', 'Segoe UI', sans-serif;
                        display: flex; align-items: center; justify-content: center;
                        min-height: 100vh; padding: 32px;
                    }
                    .card {
                        text-align: center; padding: 40px;
                        border: 2px solid #e2e8f0; border-radius: 20px;
                        max-width: 320px; width: 100%;
                    }
                    .qr-container { margin: 24px auto; }
                    .qr-container svg { width: 200px; height: 200px; }
                    h2 { font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
                    .brand { font-size: 0.8rem; color: #64748b; margin-bottom: 16px; }
                    .barcode {
                        font-family: 'SF Mono', 'Fira Code', monospace;
                        font-size: 0.85rem; font-weight: 700;
                        color: #6366f1; background: #eef2ff;
                        padding: 8px 16px; border-radius: 8px;
                        display: inline-block;
                    }
                    .footer { font-size: 0.65rem; color: #94a3b8; margin-top: 16px; }
                    @media print {
                        body { padding: 0; }
                        .card { border: none; }
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>${official.name}</h2>
                    <div class="brand">${official.phoneBrand}</div>
                    <div class="qr-container">${svgData}</div>
                    <div class="barcode">${official.barcode}</div>
                    <div class="footer">ElTraffic — Monitoring HP</div>
                </div>
                <${"script"}>
                    setTimeout(() => { window.print(); }, 300);
                </${"script"}>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
            {/* Header */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 16
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: '#eef2ff', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Users size={22} color="#6366f1" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                                Daftar Pejabat
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {officials.length} pejabat terdaftar
                            </p>
                        </div>
                    </div>
                    <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '10px 18px' }}>
                        <UserPlus size={16} />
                        Tambah Pejabat
                    </Link>
                </div>

                {/* Search */}
                {officials.length > 0 && (
                    <div className="filter-search" style={{ marginTop: 16 }}>
                        <Search size={16} />
                        <input
                            type="text"
                            name="search-officials"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama, barcode, atau merk HP..."
                        />
                    </div>
                )}
            </div>

            {/* Empty state */}
            {officials.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <UserX size={48} />
                        <p style={{ marginBottom: 16 }}>Belum ada pejabat terdaftar</p>
                        <Link to="/register" className="btn btn-primary">
                            <UserPlus size={16} />
                            Daftarkan Pejabat
                        </Link>
                    </div>
                </div>
            )}

            {/* No results */}
            {officials.length > 0 && filtered.length === 0 && (
                <div className="card">
                    <div className="empty-state">
                        <Search size={40} />
                        <p>Tidak ditemukan pejabat dengan kata kunci "{search}"</p>
                    </div>
                </div>
            )}

            {/* Officials grid */}
            {filtered.length > 0 && (
                <div className="officials-grid">
                    {filtered.map((official) => (
                        <div key={official.id} className="card officials-card animate-slide-up">

                            {/* Status badge */}
                            {(() => {
                                const status = statuses[official.id] || null;
                                return (
                                    <div style={{
                                        padding: '6px 12px', textAlign: 'center',
                                        background: status === 'IN' ? '#ecfdf5' : status === 'OUT' ? '#fef2f2' : '#f8fafc',
                                        borderBottom: '1px solid #f1f5f9'
                                    }}>
                                        <span className={`badge ${status === 'IN' ? 'badge-in' : status === 'OUT' ? 'badge-out' : ''}`}
                                            style={!status ? { background: '#e2e8f0', color: '#64748b', fontSize: '0.65rem' } : { fontSize: '0.65rem' }}
                                        >
                                            {status === 'IN' ? (
                                                <><LogIn size={11} /> HP di Dalam</>
                                            ) : status === 'OUT' ? (
                                                <><LogOut size={11} /> HP di Luar</>
                                            ) : 'Belum ada aktivitas'}
                                        </span>
                                    </div>
                                );
                            })()}

                            {/* Hidden QR for printing */}
                            <div style={{ position: 'absolute', left: -9999 }}>
                                <QRCodeSVG
                                    id={`qr-${official.id}`}
                                    value={official.barcode}
                                    size={140}
                                    level="M"
                                    bgColor="transparent"
                                    fgColor="#1e293b"
                                    includeMargin={false}
                                />
                            </div>

                            {/* Info */}
                            <div className="officials-info-section">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="officials-avatar">
                                        {official.photoUrl ? (
                                            <img src={official.photoUrl} alt="" />
                                        ) : (
                                            <User size={20} color="#94a3b8" />
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 className="officials-name">{official.name}</h4>
                                        {official.jabatan && (
                                            <p style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                                <Briefcase size={10} />
                                                {official.jabatan}
                                            </p>
                                        )}
                                        <p className="officials-brand">
                                            <Smartphone size={12} />
                                            {official.phoneBrand}
                                        </p>
                                    </div>
                                </div>

                                <div className="officials-meta">
                                    <div className="officials-meta-item">
                                        <Hash size={12} />
                                        <span className="mono">{official.imei}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="officials-actions">
                                    <Link
                                        to={`/official/${official.id}`}
                                        className="btn btn-secondary officials-action-btn"
                                    >
                                        <ExternalLink size={14} />
                                        Detail
                                    </Link>
                                    <button
                                        onClick={() => handlePrint(official)}
                                        className="btn btn-primary officials-action-btn"
                                    >
                                        <Printer size={14} />
                                        Print QR
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
