import { useState } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Avatar from "boring-avatars";
import { toTitleCase } from '../utils/formatters';
import { getGreetingInfo } from '../utils/layoutUtils';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon, label, fillIcon = false }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "flex items-center gap-3 rounded px-3 py-2 transition-colors",
      isActive
        ? "bg-zinc-800/50 text-zinc-50 border-l-2 border-primary"
        : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-50"
    )}
  >
    {({ isActive }) => (
      <>
        <span className={cn(
          "material-symbols-outlined text-[20px]",
          (isActive || fillIcon) && "fill"
        )}>
          {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </>
    )}
  </NavLink>
);

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { firstName, dayName, phrase } = getGreetingInfo(user?.nombre);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { to: '/', icon: 'dashboard', label: 'Ojo al Dato' },
    { to: '/cotizaciones', icon: 'receipt_long', label: 'Cotizaciones' },
    { to: '/tasks', icon: 'view_kanban', label: 'Tasks' },
    { to: '/inventario', icon: 'warehouse', label: 'Bodega', roles: ['ADMIN', 'EDITOR'] },
    { to: '/comercial', icon: 'shopping_cart', label: 'Catálogo', roles: ['ADMIN', 'EDITOR'] },
    { to: '/eventos', icon: 'event', label: 'Eventos' },
    { to: '/clientes', icon: 'group', label: 'Clientes' },
    { to: '/equipo', icon: 'badge', label: 'Equipo', roles: ['ADMIN'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background-light text-zinc-900 selection:bg-primary/20 font-body">
      {/* Sidebar (Strict 240px, Zinc-900) */}
      <aside className="flex w-[240px] shrink-0 flex-col bg-zinc-900 text-zinc-400 border-r border-zinc-800">
        {/* Brand / Logo Area */}
        <div className="flex items-center gap-3 border-b border-zinc-800 p-6 h-[80px] shrink-0 bg-zinc-900/50">
          <div className="flex flex-col w-full">
            <span className="font-display text-lg font-black text-white tracking-[0.2em] leading-tight">SUNPARTNERS</span>
            <span className="text-[9px] font-black tracking-[0.4em] text-primary uppercase mt-0.5">Global Logistic</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="flex flex-col gap-1 px-3">
            {filteredMenuItems.map((item) => (
              <li key={item.to}>
                <SidebarItem {...item} />
              </li>
            ))}
          </ul>

          {/* Stock Alerts Widget */}
          <div className="mt-8 px-3">
            <h3 className="mb-3 px-3 text-xs font-semibold tracking-wider text-zinc-500">Alertas de inventario</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-3 rounded border border-zinc-800 bg-zinc-900 p-3">
                <span className="material-symbols-outlined mt-0.5 text-[18px] text-alert fill">warning</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-50">Sillas Tiffany</span>
                  <span className="text-xs text-alert">Stock crítico: 5 disp.</span>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded border border-zinc-800 bg-zinc-900 p-3">
                <span className="material-symbols-outlined mt-0.5 text-[18px] text-alert fill">warning</span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-zinc-50">Mesas Redondas 1.5m</span>
                  <span className="text-xs text-alert">Stock bajo: 12 disp.</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* User Profile Area (Bottom) */}
        <div className="mt-auto border-t border-zinc-800 p-4">
          <div
            onClick={() => navigate('/perfil')}
            className="flex w-full items-center gap-3 rounded border border-transparent p-2 hover:bg-zinc-800/50 transition-colors group cursor-pointer"
          >
            <div className="size-9 rounded-lg overflow-hidden flex items-center justify-center border border-zinc-700" title={user?.nombre || 'Usuario'}>
              <Avatar
                size={36}
                name={user?.nombre || 'Admin'}
                variant="beam"
                colors={['#5486A1', '#FBAE17', '#222222', '#F2F2F2', '#EAEAEA']}
              />
            </div>
            <div className="flex flex-1 flex-col items-start min-w-0">
              <span className="text-sm font-medium text-zinc-50 truncate w-full">{toTitleCase(user?.nombre) || 'Operador'}</span>
              <span className="text-[10px] font-black text-zinc-500 truncate w-full tracking-widest">{user?.role}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
              className="material-symbols-outlined text-zinc-500 text-[20px] hover:text-zinc-50 transition-colors"
            >
              logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-hidden bg-background-light">
        {/* Header (64px) */}
        <header className="flex h-[64px] shrink-0 items-center justify-between border-b border-zinc-200 px-8 bg-background-light">
          <div className="flex flex-col">
            <p className="text-sm text-zinc-800 font-medium">
              ¡Hola, {firstName}! ¡Ya es {dayName}! {phrase}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 font-medium">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <div className="h-6 w-px bg-zinc-200"></div>
            <button className="flex size-9 items-center justify-center rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-colors relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 size-2 rounded-full bg-alert"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          {/* Corporate Footer (v22.0: Ultra-minimalist) */}
          <footer className="py-6 text-center border-t border-zinc-50 bg-white/10 shrink-0">
             {/* REMOVED: BY PROCAMPO DEL CARIBE S.A.S. (v32.0 branding cleanup) */}
          </footer>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
