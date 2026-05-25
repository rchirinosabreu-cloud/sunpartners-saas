import { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
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
  const [plannerData, setPlannerData] = useState(null);
  const [stockData, setStockData] = useState([]);

  // v55.0: Detect if current route is a Planner
  const isPlannerRoute = location.pathname.includes('/planeador');
  const plannerId = isPlannerRoute ? location.pathname.split('/')[2] : null;

  useEffect(() => {
    if (isPlannerRoute && plannerId) {
       const fetchPlanner = async () => {
         try {
           const [qRes, sRes] = await Promise.all([
             axios.get(`/api/quotations/${plannerId}`),
             axios.get('/api/inventory/bodega')
           ]);
           setPlannerData(qRes.data);
           setStockData(sRes.data);
         } catch (e) {
           console.error("Error fetching alerts data", e);
         }
       };
       fetchPlanner();
    } else {
      setPlannerData(null);
    }
  }, [isPlannerRoute, plannerId]);

  const inventoryAlerts = useMemo(() => {
    if (!plannerData || !plannerData.planning || !plannerData.planning.materiales) return [];

    const materiales = plannerData.planning.materiales;
    const equipamiento = materiales.filter(m => m.category === 'EQUIPAMIENTO' && !m.isExternal);

    // Resolve needed per warehouse item
    const requirements = {};
    equipamiento.forEach(m => {
       // Note: the planner materials already are somewhat exploded, but we need to match names
       // In a real scenario we'd use IDs, but here we can try matching by name for simplicity
       // or if the planner material has a link to the original inventory item.
       // Actually, materials in Planner have 'nombre'.
       requirements[m.nombre] = (requirements[m.nombre] || 0) + (parseInt(m.cantidad) || 0);
    });

    const alerts = [];
    Object.entries(requirements).forEach(([nombre, needed]) => {
       const stockItem = stockData.find(s => s.nombre.toLowerCase() === nombre.toLowerCase());
       if (stockItem) {
          const totalStock = (stockItem.claseA || 0) + (stockItem.claseB || 0) + (stockItem.claseC || 0);
          if (needed > totalStock) {
             alerts.push({
               nombre,
               needed,
               available: totalStock
             });
          }
       }
    });

    return alerts;
  }, [plannerData, stockData]);

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

          {/* Stock Alerts Widget (v55.0: Dynamic) */}
          {isPlannerRoute && (
            <div className="mt-8 px-3">
              <h3 className="mb-3 px-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">Alertas de inventario</h3>
              <div className="flex flex-col gap-2">
                {inventoryAlerts.length === 0 ? (
                  <div className="px-3 py-2 border border-zinc-800/50 rounded bg-zinc-900/30">
                    <p className="text-[10px] text-zinc-500 font-bold tracking-widest text-center uppercase">Sin quiebres de stock</p>
                  </div>
                ) : (
                  inventoryAlerts.map((alert, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded border border-alert/20 bg-alert/5 p-3">
                      <span className="material-symbols-outlined mt-0.5 text-[18px] text-alert fill">warning</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-zinc-50 truncate">{alert.nombre}</span>
                        <span className="text-[10px] font-bold text-alert uppercase tracking-tighter">Shortage: -{alert.needed - alert.available} (Disp: {alert.available})</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
