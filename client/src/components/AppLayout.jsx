import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Calendar,
  FileText,
  Users,
  UserCircle,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon: Icon, label, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) => cn(
      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
      "hover:bg-zinc-100 text-zinc-900",
      isActive && "bg-zinc-100 font-medium border-l-2 border-brand-blue rounded-l-none"
    )}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </NavLink>
);

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/inventario', icon: Package, label: 'Inventario' },
    { to: '/eventos', icon: Calendar, label: 'Eventos' },
    { to: '/cotizaciones', icon: FileText, label: 'Cotizaciones' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
    { to: '/equipo', icon: UserCircle, label: 'Equipo' },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-zinc-200 rounded-md shadow-sm"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-50 border-r border-zinc-200 transform transition-transform lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-8 px-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900">Sunpartners</h1>
            <p className="text-xs text-zinc-500">SaaS de Gestión</p>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <SidebarItem
                key={item.to}
                {...item}
                onClick={() => setIsSidebarOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-auto pt-4 border-t border-zinc-200 space-y-1">
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-zinc-900 truncate">{user?.nombre}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md transition-colors hover:bg-zinc-100 text-zinc-900"
            >
              <LogOut className="w-5 h-5 text-zinc-500" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AppLayout;
