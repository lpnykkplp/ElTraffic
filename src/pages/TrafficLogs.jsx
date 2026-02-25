import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    LogIn,
    LogOut,
    Filter,
    Search,
    ClipboardList,
    Calendar,
} from 'lucide-react';
import {
    getTrafficLogs,
    getOfficialById,
    formatDate,
    formatTime,
} from '../utils/dataStore';

export default function TrafficLogs() {
    const [logs, setLogs] = useState([]);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        async function load() {
            const allLogs = await getTrafficLogs();
            const enriched = await Promise.all(
                allLogs.map(async (log) => ({
                    ...log,
                    official: await getOfficialById(log.officialId),
                }))
            );
            setLogs(enriched);
        }
        load();
    }, []);

    const filteredLogs = logs.filter((log) => {
        if (filter !== 'ALL' && log.type !== filter) return false;
        if (search && !log.official?.name?.toLowerCase().includes(search.toLowerCase())) return false;
        if (dateFilter && !log.timestamp.startsWith(dateFilter)) return false;
        return true;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Filters */}
            <div className="card" style={{ padding: 20 }}>
                <div className="filters">
                    <div className="filter-search">
                        <Search size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama pejabat..."
                        />
                    </div>

                    <div className="filter-date">
                        <Calendar size={16} />
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>

                    <div className="filter-tabs">
                        {['ALL', 'IN', 'OUT'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`filter-tab ${filter === f ? 'active' : ''}`}
                            >
                                {f === 'ALL' ? 'Semua' : f === 'IN' ? 'Masuk' : 'Keluar'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Results count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#64748b' }}>
                <Filter size={16} />
                <span>{filteredLogs.length} catatan ditemukan</span>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                {filteredLogs.length === 0 ? (
                    <div className="empty-state">
                        <ClipboardList size={48} />
                        <p>Tidak ada catatan yang cocok</p>
                    </div>
                ) : (
                    <>
                        <div className="table-header">
                            <div>Pejabat</div>
                            <div>Perangkat</div>
                            <div>Tanggal</div>
                            <div>Waktu</div>
                            <div className="right">Status</div>
                        </div>
                        <div>
                            {filteredLogs.map((log) => (
                                <div key={log.id} className="table-row">
                                    <div className="name-col">
                                        <div className="avatar" style={{ width: 36, height: 36 }}>
                                            {log.official?.photoUrl ? (
                                                <img src={log.official.photoUrl} alt="" />
                                            ) : (
                                                log.official?.name?.charAt(0) || '?'
                                            )}
                                        </div>
                                        <Link to={`/official/${log.officialId}`}>
                                            {log.official?.name || 'Tidak diketahui'}
                                        </Link>
                                    </div>
                                    <div className="text-col">{log.official?.phoneBrand || '-'}</div>
                                    <div className="text-col">{formatDate(log.timestamp)}</div>
                                    <div className="text-col">{formatTime(log.timestamp)}</div>
                                    <div className="right">
                                        <span className={`badge ${log.type === 'IN' ? 'badge-in' : 'badge-out'}`}>
                                            {log.type === 'IN' ? <LogIn size={14} /> : <LogOut size={14} />}
                                            {log.type === 'IN' ? 'MASUK' : 'KELUAR'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
