import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    LogIn,
    LogOut,
    ScanBarcode,
    ArrowRight,
    Smartphone,
    Clock,
    Calendar,
} from 'lucide-react';
import {
    getStats,
    getTrafficLogs,
    getOfficialById,
    formatDateTime,
} from '../utils/dataStore';

const statCards = [
    { key: 'totalOfficials', label: 'Total Pejabat', icon: Users, bg: '#6366f1' },
    { key: 'insideCount', label: 'HP di Dalam', icon: LogIn, bg: '#10b981' },
    { key: 'outsideCount', label: 'HP di Luar', icon: LogOut, bg: '#ef4444' },
    { key: 'todayScans', label: 'Scan Hari Ini', icon: ScanBarcode, bg: '#f59e0b' },
];

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalOfficials: 0,
        insideCount: 0,
        outsideCount: 0,
        todayScans: 0,
    });
    const [recentLogs, setRecentLogs] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const dayName = dayNames[currentTime.getDay()];
    const dateStr = `${currentTime.getDate()} ${monthNames[currentTime.getMonth()]} ${currentTime.getFullYear()}`;
    const timeStr = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    useEffect(() => {
        async function loadData() {
            setStats(await getStats());
            const logs = (await getTrafficLogs()).slice(0, 10);
            const enriched = await Promise.all(
                logs.map(async (log) => ({
                    ...log,
                    official: await getOfficialById(log.officialId),
                }))
            );
            setRecentLogs(enriched);
        }
        loadData();
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Date & Time */}
            <div className="card" style={{
                padding: '20px 24px', marginBottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 12
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: '#eef2ff', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Calendar size={22} color="#6366f1" />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, marginBottom: 2 }}>
                            {dayName}
                        </p>
                        <p style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                            {dateStr}
                        </p>
                    </div>
                </div>
                <div style={{
                    fontSize: '1.5rem', fontWeight: 700, color: '#0f172a',
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    letterSpacing: 2, background: '#f8fafc',
                    padding: '8px 16px', borderRadius: 10
                }}>
                    {timeStr}
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                {statCards.map(({ key, label, icon: Icon, bg }, i) => (
                    <div
                        key={key}
                        className="card stat-card animate-fade-in"
                        style={{ animationDelay: `${i * 80}ms` }}
                    >
                        <div className="stat-icon" style={{ background: bg }}>
                            <Icon size={24} color="white" />
                        </div>
                        <h3>{stats[key]}</h3>
                        <p>{label}</p>
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="quick-actions">
                <Link to="/scan" className="action-card" style={{ background: '#6366f1' }}>
                    <div className="action-icon">
                        <ScanBarcode size={28} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3>Scan Barcode</h3>
                        <p>Scan masuk atau keluar</p>
                    </div>
                    <ArrowRight size={20} style={{ opacity: 0.6 }} />
                </Link>
                <Link to="/register" className="action-card" style={{ background: '#0f172a' }}>
                    <div className="action-icon">
                        <Users size={28} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3>Registrasi Pejabat</h3>
                        <p>Daftarkan pejabat baru</p>
                    </div>
                    <ArrowRight size={20} style={{ opacity: 0.6 }} />
                </Link>
            </div>

            {/* Recent activity */}
            <div className="card">
                <div className="feed-header">
                    <h3>
                        <Clock size={18} color="#94a3b8" />
                        Aktivitas Terbaru
                    </h3>
                    <Link to="/logs">Lihat Semua</Link>
                </div>

                {recentLogs.length === 0 ? (
                    <div className="empty-state">
                        <Smartphone size={48} />
                        <p>Belum ada aktivitas</p>
                    </div>
                ) : (
                    <div>
                        {recentLogs.map((log) => (
                            <div key={log.id} className="feed-item">
                                <div className="avatar">
                                    {log.official?.photoUrl ? (
                                        <img src={log.official.photoUrl} alt="" />
                                    ) : (
                                        log.official?.name?.charAt(0) || '?'
                                    )}
                                </div>
                                <div className="feed-info">
                                    <div className="name">{log.official?.name || 'Tidak diketahui'}</div>
                                    <div className="time">{formatDateTime(log.timestamp)}</div>
                                </div>
                                <span className={`badge ${log.type === 'IN' ? 'badge-in' : 'badge-out'}`}>
                                    {log.type === 'IN' ? <LogIn size={14} /> : <LogOut size={14} />}
                                    {log.type === 'IN' ? 'MASUK' : 'KELUAR'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
