import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    LogIn,
    LogOut,
    ScanBarcode,
    ArrowRight,
    Smartphone,
    Clock,
    Loader2,
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsData, logsData] = await Promise.all([
                    getStats(),
                    getTrafficLogs(),
                ]);
                setStats(statsData);

                const recent = logsData.slice(0, 10);
                const enriched = await Promise.all(
                    recent.map(async (log) => ({
                        ...log,
                        official: await getOfficialById(log.officialId),
                    }))
                );
                setRecentLogs(enriched);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                <Loader2 size={32} color="#6366f1" className="spin" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
