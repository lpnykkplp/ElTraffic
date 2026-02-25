import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    UserPlus,
    ScanBarcode,
    ClipboardList,
    Smartphone,
    Users,
} from 'lucide-react';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/register', label: 'Registrasi', icon: UserPlus },
    { path: '/officials', label: 'Daftar Pejabat', icon: Users },
    { path: '/scan', label: 'Scan Barcode', icon: ScanBarcode },
    { path: '/logs', label: 'Riwayat', icon: ClipboardList },
];

export default function Layout() {
    const location = useLocation();

    const getPageTitle = () => {
        const item = navItems.find((n) => n.path === location.pathname);
        if (item) return item.label;
        if (location.pathname.startsWith('/official/')) return 'Detail Pejabat';
        return 'ElTraffic';
    };

    return (
        <div className="app-layout">
            {/* Sidebar (desktop only) */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Smartphone size={20} color="white" />
                    </div>
                    <div>
                        <h1>ElTraffic</h1>
                        <p>Monitoring HP</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(({ path, label, icon: Icon }) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) =>
                                `nav-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <Icon size={20} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <p>v1.0.0</p>
                    <p>© 2026 ElTraffic</p>
                </div>
            </aside>

            {/* Main area */}
            <div className="main-content">
                <header className="top-bar">
                    <h2>{getPageTitle()}</h2>
                </header>

                <main className="page-content">
                    <div className="page-inner">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Bottom Navigation (mobile) */}
            <nav className="bottom-nav">
                {navItems.map(({ path, label, icon: Icon }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            `bottom-nav-item ${isActive ? 'active' : ''}`
                        }
                    >
                        <Icon size={20} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
