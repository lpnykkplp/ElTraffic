import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Smartphone,
    Hash,
    Camera,
    Save,
    CheckCircle,
    Copy,
    X,
    Briefcase,
} from 'lucide-react';
import { addOfficial } from '../utils/dataStore';

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        jabatan: '',
        phoneBrand: '',
        imei: '',
        photoUrl: '',
        phonePhotoUrl: '',
    });
    const [success, setSuccess] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [phonePhotoPreview, setPhonePhotoPreview] = useState(null);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (field, previewSetter) => (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setForm((prev) => ({ ...prev, [field]: reader.result }));
            previewSetter(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.phoneBrand || !form.imei) return;
        const official = await addOfficial(form);
        setSuccess(official);
    };

    const copyBarcode = () => {
        if (success?.barcode) {
            navigator.clipboard.writeText(success.barcode);
        }
    };

    const resetForm = () => {
        setForm({ name: '', jabatan: '', phoneBrand: '', imei: '', photoUrl: '', phonePhotoUrl: '' });
        setPhotoPreview(null);
        setPhonePhotoPreview(null);
        setSuccess(null);
    };

    if (success) {
        return (
            <div style={{ maxWidth: 480, margin: '0 auto' }} className="animate-slide-up">
                <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                    <div className="success-icon">
                        <CheckCircle size={32} color="#10b981" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                        Registrasi Berhasil!
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        Pejabat <strong style={{ color: '#0f172a' }}>{success.name}</strong> telah terdaftar.
                    </p>

                    <div className="barcode-display">
                        <div className="label">Kode Barcode</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <code>{success.barcode}</code>
                            <button
                                onClick={copyBarcode}
                                style={{ padding: 8, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer' }}
                                title="Copy"
                            >
                                <Copy size={16} color="#64748b" />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={resetForm} className="btn btn-secondary" style={{ flex: 1 }}>
                            Daftar Lagi
                        </button>
                        <button
                            onClick={() => navigate(`/official/${success.id}`)}
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                        >
                            Lihat Detail
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <form onSubmit={handleSubmit}>
                {/* Personal info */}
                <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User size={18} color="#6366f1" />
                        Informasi Pejabat
                    </h3>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-name">
                            Nama Pejabat <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="reg-name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Masukkan nama lengkap"
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-jabatan">
                            Jabatan
                        </label>
                        <div className="form-input-icon">
                            <Briefcase size={16} />
                            <input
                                type="text"
                                id="reg-jabatan"
                                name="jabatan"
                                value={form.jabatan}
                                onChange={handleChange}
                                placeholder="Contoh: Kapolsek, Kanit Lantas"
                                className="form-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Device info */}
                <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Smartphone size={18} color="#6366f1" />
                        Informasi Perangkat
                    </h3>
                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-phoneBrand">
                            Merk HP <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="reg-phoneBrand"
                            name="phoneBrand"
                            value={form.phoneBrand}
                            onChange={handleChange}
                            placeholder="Contoh: Samsung Galaxy A54"
                            required
                            className="form-input"
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="reg-imei">
                            Nomor IMEI <span className="required">*</span>
                        </label>
                        <div className="form-input-icon">
                            <Hash size={16} />
                            <input
                                type="text"
                                id="reg-imei"
                                name="imei"
                                value={form.imei}
                                onChange={handleChange}
                                placeholder="15 digit nomor IMEI"
                                required
                                maxLength={15}
                                className="form-input"
                                style={{ fontFamily: "'SF Mono', 'Fira Code', monospace" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Photos */}
                <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Camera size={18} color="#6366f1" />
                        Upload Foto
                    </h3>
                    <div className="photo-grid">
                        {/* Official photo */}
                        <div>
                            <label className="form-label" htmlFor="reg-photo">Foto Pejabat</label>
                            <label>
                                <div className="photo-upload">
                                    {photoPreview ? (
                                        <>
                                            <img src={photoPreview} alt="Preview" />
                                            <button
                                                type="button"
                                                className="photo-remove"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setPhotoPreview(null);
                                                    setForm((prev) => ({ ...prev, photoUrl: '' }));
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="photo-placeholder">
                                            <User size={36} />
                                            <span>Upload Foto</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="reg-photo"
                                    accept="image/*"
                                    onChange={handleFileChange('photoUrl', setPhotoPreview)}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>

                        {/* Phone photo */}
                        <div>
                            <label className="form-label" htmlFor="reg-phonePhoto">Foto HP</label>
                            <label>
                                <div className="photo-upload">
                                    {phonePhotoPreview ? (
                                        <>
                                            <img src={phonePhotoPreview} alt="Preview" />
                                            <button
                                                type="button"
                                                className="photo-remove"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setPhonePhotoPreview(null);
                                                    setForm((prev) => ({ ...prev, phonePhotoUrl: '' }));
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="photo-placeholder">
                                            <Smartphone size={36} />
                                            <span>Upload Foto</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="reg-phonePhoto"
                                    accept="image/*"
                                    onChange={handleFileChange('phonePhotoUrl', setPhonePhotoPreview)}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <button type="submit" className="btn btn-primary btn-full">
                    <Save size={18} />
                    Simpan Data Pejabat
                </button>
            </form>
        </div>
    );
}
