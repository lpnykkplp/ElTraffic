import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    Smartphone,
    Hash,
    ScanBarcode,
    LogIn,
    LogOut,
    ArrowLeft,
    Clock,
    Trash2,
    Copy,
    Calendar,
    Edit3,
    Save,
    X,
    Briefcase,
    Camera,
} from 'lucide-react';
import {
    getOfficialById,
    getLogsByOfficialId,
    getLastLog,
    deleteOfficial,
    updateOfficial,
    formatDateTime,
    formatDate,
} from '../utils/dataStore';

export default function OfficialDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [official, setOfficial] = useState(null);
    const [logs, setLogs] = useState([]);
    const [lastStatus, setLastStatus] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editPhotoPreview, setEditPhotoPreview] = useState(null);
    const [editPhonePhotoPreview, setEditPhonePhotoPreview] = useState(null);

    useEffect(() => {
        async function load() {
            const o = await getOfficialById(id);
            if (!o) { navigate('/'); return; }
            setOfficial(o);
            setEditForm({ name: o.name, jabatan: o.jabatan || '', phoneBrand: o.phoneBrand, imei: o.imei, photoUrl: o.photoUrl || '', phonePhotoUrl: o.phonePhotoUrl || '' });
            setEditPhotoPreview(o.photoUrl || null);
            setEditPhonePhotoPreview(o.phonePhotoUrl || null);
            setLogs(await getLogsByOfficialId(id));
            const last = await getLastLog(id);
            setLastStatus(last ? last.type : null);
        }
        load();
    }, [id, navigate]);

    const handleDelete = async () => { await deleteOfficial(id); navigate('/'); };

    const handleSaveEdit = async () => {
        const updated = await updateOfficial(id, editForm);
        if (updated) {
            setOfficial(updated);
            setEditing(false);
            setEditPhotoPreview(updated.photoUrl || null);
            setEditPhonePhotoPreview(updated.phonePhotoUrl || null);
        }
    };

    const handleEditFileChange = (field, setPreview) => (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            setEditForm((prev) => ({ ...prev, [field]: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const copyBarcode = () => {
        if (official?.barcode) navigator.clipboard.writeText(official.barcode);
    };

    if (!official) return null;

    return (
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem',
                    color: '#64748b', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', padding: 0
                }}
            >
                <ArrowLeft size={16} />
                Kembali
            </button>

            {/* Profile card */}
            <div className="card" style={{ overflow: 'hidden' }}>
                {/* Status header */}
                <div className="profile-header" style={{
                    background: lastStatus === 'IN' ? '#ecfdf5' : lastStatus === 'OUT' ? '#fef2f2' : '#f8fafc'
                }}>
                    <span className={`badge ${lastStatus === 'IN' ? 'badge-in' : lastStatus === 'OUT' ? 'badge-out' : ''}`}
                        style={!lastStatus ? { background: '#e2e8f0', color: '#64748b' } : {}}
                    >
                        {lastStatus === 'IN' ? (
                            <><LogIn size={14} /> HP di Dalam</>
                        ) : lastStatus === 'OUT' ? (
                            <><LogOut size={14} /> HP di Luar</>
                        ) : (
                            'Belum ada aktivitas'
                        )}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <button
                            onClick={() => setEditing(!editing)}
                            style={{
                                padding: 8, borderRadius: 8, border: 'none', background: 'none',
                                cursor: 'pointer', color: editing ? '#ef4444' : '#64748b'
                            }}
                        >
                            {editing ? <X size={16} /> : <Edit3 size={16} />}
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            style={{
                                padding: 8, borderRadius: 8, border: 'none', background: 'none',
                                cursor: 'pointer', color: '#64748b'
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="profile-body">
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                        {/* Photos */}
                        <div className="profile-photos" style={{ flexDirection: 'column' }}>
                            <div className="profile-photo">
                                {official.photoUrl ? (
                                    <img src={official.photoUrl} alt="Pejabat" />
                                ) : (
                                    <User size={40} />
                                )}
                            </div>
                            {official.phonePhotoUrl && (
                                <div className="profile-photo">
                                    <img src={official.phonePhotoUrl} alt="HP" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {editing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" htmlFor="edit-name">Nama</label>
                                        <input
                                            type="text" id="edit-name" name="edit-name" value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" htmlFor="edit-jabatan">Jabatan</label>
                                        <input
                                            type="text" id="edit-jabatan" name="edit-jabatan" value={editForm.jabatan}
                                            onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                                            className="form-input"
                                            placeholder="Contoh: Kapolsek"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" htmlFor="edit-phoneBrand">Merk HP</label>
                                        <input
                                            type="text" id="edit-phoneBrand" name="edit-phoneBrand" value={editForm.phoneBrand}
                                            onChange={(e) => setEditForm({ ...editForm, phoneBrand: e.target.value })}
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label" htmlFor="edit-imei">IMEI</label>
                                        <input
                                            type="text" id="edit-imei" name="edit-imei" value={editForm.imei}
                                            onChange={(e) => setEditForm({ ...editForm, imei: e.target.value })}
                                            className="form-input"
                                            style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}
                                        />
                                    </div>
                                    {/* Photo uploads */}
                                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: 120 }}>
                                            <label className="form-label" htmlFor="edit-photo">
                                                <Camera size={14} style={{ marginRight: 4 }} /> Foto Pejabat
                                            </label>
                                            <label style={{ cursor: 'pointer', display: 'block' }}>
                                                <div style={{
                                                    width: '100%', height: 120, borderRadius: 12,
                                                    border: '2px dashed #cbd5e1', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    overflow: 'hidden', background: '#f8fafc'
                                                }}>
                                                    {editPhotoPreview ? (
                                                        <img src={editPhotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <User size={32} color="#94a3b8" />
                                                    )}
                                                </div>
                                                <input type="file" id="edit-photo" accept="image/*"
                                                    onChange={handleEditFileChange('photoUrl', setEditPhotoPreview)}
                                                    style={{ display: 'none' }} />
                                            </label>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 120 }}>
                                            <label className="form-label" htmlFor="edit-phonePhoto">
                                                <Smartphone size={14} style={{ marginRight: 4 }} /> Foto HP
                                            </label>
                                            <label style={{ cursor: 'pointer', display: 'block' }}>
                                                <div style={{
                                                    width: '100%', height: 120, borderRadius: 12,
                                                    border: '2px dashed #cbd5e1', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    overflow: 'hidden', background: '#f8fafc'
                                                }}>
                                                    {editPhonePhotoPreview ? (
                                                        <img src={editPhonePhotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <Smartphone size={32} color="#94a3b8" />
                                                    )}
                                                </div>
                                                <input type="file" id="edit-phonePhoto" accept="image/*"
                                                    onChange={handleEditFileChange('phonePhotoUrl', setEditPhonePhotoPreview)}
                                                    style={{ display: 'none' }} />
                                            </label>
                                        </div>
                                    </div>
                                    <button onClick={handleSaveEdit} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                                        <Save size={16} /> Simpan
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                                        {official.name}
                                    </h2>
                                    {official.jabatan && (
                                        <p style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                            <Briefcase size={14} />
                                            {official.jabatan}
                                        </p>
                                    )}
                                    <div className="profile-info-grid">
                                        <div className="info-item">
                                            <Smartphone size={16} />
                                            <div>
                                                <div className="label">Merk HP</div>
                                                <div className="value">{official.phoneBrand}</div>
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <Hash size={16} />
                                            <div>
                                                <div className="label">IMEI</div>
                                                <div className="value mono">{official.imei}</div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Barcode */}
                            <div className="info-item" style={{ background: '#eef2ff', border: '1px solid #e0e7ff' }}>
                                <ScanBarcode size={16} color="#6366f1" />
                                <div style={{ flex: 1 }}>
                                    <div className="label">Barcode</div>
                                    <div className="value accent" style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}>
                                        {official.barcode}
                                    </div>
                                </div>
                                <button
                                    onClick={copyBarcode}
                                    style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer' }}
                                >
                                    <Copy size={16} color="#6366f1" />
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
                                <Calendar size={14} />
                                Terdaftar: {formatDate(official.createdAt)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity history */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div className="feed-header">
                    <h3>
                        <Clock size={18} color="#94a3b8" />
                        Riwayat Aktivitas
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{logs.length} catatan</span>
                </div>

                {logs.length === 0 ? (
                    <div className="empty-state">
                        <Clock size={40} />
                        <p>Belum ada aktivitas tercatat</p>
                    </div>
                ) : (
                    <div>
                        {logs.map((log) => (
                            <div key={log.id} className="activity-item">
                                <div
                                    className="activity-icon"
                                    style={{ background: log.type === 'IN' ? '#d1fae5' : '#fee2e2' }}
                                >
                                    {log.type === 'IN' ? (
                                        <LogIn size={20} color="#10b981" />
                                    ) : (
                                        <LogOut size={20} color="#ef4444" />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0f172a' }}>
                                        {log.type === 'IN' ? 'Masuk' : 'Keluar'}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                                        {formatDateTime(log.timestamp)}
                                    </p>
                                </div>
                                <span className={`badge ${log.type === 'IN' ? 'badge-in' : 'badge-out'}`}>
                                    {log.type === 'IN' ? 'MASUK' : 'KELUAR'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-icon" style={{ background: '#fee2e2' }}>
                            <Trash2 size={24} color="#ef4444" />
                        </div>
                        <h3>Hapus Pejabat?</h3>
                        <p>
                            Data <strong>{official.name}</strong> dan semua riwayat aktivitasnya akan dihapus permanen.
                        </p>
                        <div className="modal-actions">
                            <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">
                                Batal
                            </button>
                            <button onClick={handleDelete} className="btn btn-danger">
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
