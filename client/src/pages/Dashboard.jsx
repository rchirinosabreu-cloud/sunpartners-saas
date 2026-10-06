import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { toTitleCase } from '../utils/formatters';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import SharedUserAvatar from '../components/SharedUserAvatar';
import axios from 'axios';
import { filterActiveInventoryAlerts } from '../utils/inventoryAlerts';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}
import AnnouncementModal from '../components/modals/AnnouncementModal';
import HistoryModal from '../components/modals/HistoryModal';

const MetricCard = ({ label, value, unit, icon, alert = false, progress = null }) => (
  <div className={`flex min-h-[140px] flex-col justify-between rounded-xl border p-6 relative overflow-hidden transition-all hover:shadow-lg ${
    alert ? 'border-alert/20 bg-white' : 'border-zinc-200 bg-white'
  }`}>
    {alert && <div className="absolute top-0 left-0 w-1.5 h-full bg-alert"></div>}

    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <span className={`text-[11px] font-bold uppercase tracking-[0.1em] ${alert ? 'text-alert' : 'text-zinc-400'}`}>
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[40px] font-bold leading-none text-zinc-900 tracking-tight">{value}</span>
          <span className="text-[11px] font-semibold text-zinc-400">{unit}</span>
        </div>
      </div>
      <div className={`flex size-12 items-center justify-center rounded-xl ${alert ? 'bg-alert/10 text-alert' : 'bg-zinc-50 text-zinc-400'}`}>
        <span className="material-symbols-outlined text-[24px]">{icon}</span>
      </div>
    </div>

    {progress !== null && (
      <div className="mt-4 space-y-2">
        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] font-bold text-zinc-400">{progress}% completado</p>
      </div>
    )}
  </div>
);

const AnnouncementItem = ({ id, content, type, author, date, onDelete, canDelete }) => {
  const typeColors = {
    URGENTE: 'border-red-100 bg-red-50/30 text-red-700',
    LOGRO: 'border-green-100 bg-green-50/30 text-green-700',
    INFO: 'border-zinc-100 bg-zinc-50/50 text-zinc-600'
  };

  return (
    <div className={`p-4 rounded-xl border ${typeColors[type] || typeColors.INFO} flex items-start gap-4 animate-in slide-in-from-right-4 duration-300 relative group`}>
      <SharedUserAvatar user={author} size={40} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-bold text-zinc-900 truncate">{toTitleCase(author.nombre)}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium opacity-60">
              {new Date(date).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
            </span>
            {canDelete && (
              <button
                onClick={() => onDelete(id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-red-500 rounded-md hover:bg-white"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        <span className={cn(
          "inline-block mt-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border opacity-60",
          type === 'URGENTE' ? "bg-red-100 border-red-200 text-red-700" : "bg-white/50 border-current"
        )}>
          {type === 'URGENTE' ? 'ATENCIÓN' : type}
        </span>
      </div>
    </div>
  );
};

const InventoryAlertWidget = ({ alerts }) => {
  return (
    <section aria-labelledby="inventory-alerts-title" className="bg-white rounded-[12px] border border-alert/30 p-6 shadow-sm flex flex-col min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <h2 id="inventory-alerts-title" className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
        <span aria-hidden="true" className="material-symbols-outlined text-alert fill">warning</span>
        Alertas de Inventario Comprometido
      </h2>
      <span className="text-[11px] font-semibold text-amber-800 bg-alert/10 px-2.5 py-1 rounded-full shrink-0">
        {alerts.length} {alerts.length === 1 ? 'vigente' : 'vigentes'}
      </span>
      </div>
      {alerts.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4">Sin alertas de inventario vigentes</p>
      ) : (
      <div aria-label="Alertas vigentes" className="overflow-y-auto pr-1 custom-scrollbar space-y-3 max-h-[300px]">
        {alerts.map((alert) => (
          <Link
             to={`/cotizaciones/${alert.quotationId}`}
             key={alert.id}
             className="p-4 rounded-[12px] border border-alert/15 bg-alert/[0.03] flex items-start gap-3 hover:border-alert/40 hover:bg-alert/[0.06] transition-all cursor-pointer"
          >
             <div className="size-10 rounded-lg bg-alert/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-alert text-[20px]">shopping_cart_checkout</span>
             </div>
             <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-3 mb-1">
                   <p className="text-xs font-bold text-zinc-900 break-words">{alert.productName}</p>
                   <span className="text-[10px] font-bold text-amber-800 bg-alert/10 px-2 py-0.5 rounded shrink-0">-{alert.deficit} und</span>
                </div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate mb-1">
                   {alert.quotation.client.razon_social} • {alert.quotation.nombre_evento}
                </p>
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-tighter">
                      {alert.motivo || "Déficit Detectado"}
                   </span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1 text-[9px] font-black text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                      <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                      {new Date(alert.startDate).toLocaleDateString('es-CO', { timeZone: 'America/Bogota' })}
                   </div>
                   <div className="h-3 w-px bg-zinc-200"></div>
                   <p className="text-[9px] font-bold text-zinc-400 italic underline decoration-zinc-200">ID: SP-{alert.quotation.consecutivo}</p>
                </div>
             </div>
          </Link>
        ))}
      </div>
      )}
      {alerts.length > 0 && <div className="mt-4 pt-4 border-t border-zinc-100">
         <p className="text-[10px] font-medium text-zinc-400 leading-relaxed italic">
            Solo eventos vigentes hasta el fin del desmontaje. Haz clic para revisar la cotización.
         </p>
      </div>}
    </section>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [stats, setStats] = useState({ progresoMes: 0, totalRealizados: 0, logrosRecientes: [] });
  const [announcements, setAnnouncements] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [alertClock, setAlertClock] = useState(() => Date.now());
  const [globalQuote, setGlobalQuote] = useState('');
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [editQuoteValue, setEditQuoteValue] = useState('');
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      // v67.1: Isolated fetches to prevent single-endpoint failures from crashing entire Dashboard
      const [statsRes, annRes, quoteRes, alertsRes] = await Promise.allSettled([
        axios.get('/api/tasks/dashboard-stats'),
        axios.get('/api/announcements'),
        axios.get('/api/settings/global_motivational_quote'),
        axios.get('/api/inventory/alerts')
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      if (annRes.status === 'fulfilled') {
        setAnnouncements(annRes.value.data);
      }

      if (quoteRes.status === 'fulfilled' && quoteRes.value.data) {
        setGlobalQuote(quoteRes.value.data.value);
        setEditQuoteValue(quoteRes.value.data.value);
      }

      if (alertsRes.status === 'fulfilled') {
        setInventoryAlerts(alertsRes.value.data || []);
      } else {
        console.warn("[InventoryAlerts] Failed to load, defaulting to empty list.");
        setInventoryAlerts([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    if (location.state?.accessDenied) {
      setShowAccessDenied(true);
      // Limpiar el estado para no mostrar el mensaje de nuevo al recargar
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setShowAccessDenied(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [fetchDashboardData, location.state]);

  // Recheck stock alerts while the dashboard is open and on returning to the tab.
  useEffect(() => {
    let disposed = false;
    const refreshAlerts = async () => {
      setAlertClock(Date.now());
      try {
        const { data } = await axios.get('/api/inventory/alerts');
        if (!disposed) setInventoryAlerts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.warn('[InventoryAlerts] Refresh failed:', error.message);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshAlerts();
    };
    const interval = window.setInterval(refreshAlerts, 60000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refreshAlerts);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refreshAlerts);
    };
  }, []);

  const activeInventoryAlerts = useMemo(() => filterActiveInventoryAlerts(inventoryAlerts, alertClock),
    [inventoryAlerts, alertClock]);

  // Expire the next alert at its actual deadline, even if a refresh fails.
  useEffect(() => {
    if (activeInventoryAlerts.length === 0) return;
    const nextDeadline = Math.min(...activeInventoryAlerts.map(alert => new Date(alert.endDate).getTime()));
    const timer = window.setTimeout(() => setAlertClock(Date.now()),
      Math.min(Math.max(0, nextDeadline - Date.now()), 2147483647));
    return () => window.clearTimeout(timer);
  }, [activeInventoryAlerts]);

  const handleSaveQuote = async () => {
    try {
      await axios.post('/api/settings', {
        key: 'global_motivational_quote',
        value: editQuoteValue
      });
      setGlobalQuote(editQuoteValue);
      setIsEditingQuote(false);
    } catch (e) {
      console.error("Error updating quote", e);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este anuncio?')) return;
    try {
      const response = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="size-12 bg-zinc-100 rounded-full"></div>
          <span className="text-sm font-medium text-zinc-400">Ojo al Dato: Sincronizando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-16 bg-[#F5F6FA] min-h-full font-body"
      style={{ '--font-body': '"Plus Jakarta Sans", sans-serif', '--font-display': '"Plus Jakarta Sans", sans-serif' }}>
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Access Denied Banner */}
        {showAccessDenied && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-center gap-6 animate-in slide-in-from-top-4 duration-500 shadow-sm">
            <div className="size-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-red-600 text-[32px] fill">gpp_maybe</span>
            </div>
            <div className="flex-1">
              <h3 className="text-red-900 font-black tracking-tight text-lg">Acceso denegado</h3>
              <p className="text-red-700 font-medium italic">No tienes permisos para visualizar el módulo de Cotizaciones.</p>
            </div>
            <button onClick={() => setShowAccessDenied(false)} className="text-red-400 hover:text-red-900 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* Welcome Header Section (v56.0: Structured re-location & Zero-Box Design) */}
        <div className="flex flex-col">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            ¡Hola, {user?.nombre?.split(' ')[0] || 'Operador'}!
          </h1>

          <div className="group relative flex items-start">
            {isEditingQuote ? (
              <div className="flex items-center gap-3 w-full max-w-3xl">
                <input
                  type="text"
                  value={editQuoteValue}
                  onChange={(e) => setEditQuoteValue(e.target.value)}
                  className="text-xl text-slate-600 font-medium bg-white border-2 border-primary/20 rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-all w-full shadow-sm"
                  autoFocus
                />
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleSaveQuote} className="p-3 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all shadow-md active:scale-95">
                    <span className="material-symbols-outlined text-[24px]">check</span>
                  </button>
                  <button onClick={() => { setIsEditingQuote(false); setEditQuoteValue(globalQuote); }} className="p-3 bg-white border-2 border-zinc-100 text-zinc-400 rounded-xl hover:bg-zinc-50 transition-all active:scale-95">
                    <span className="material-symbols-outlined text-[24px]">close</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-4xl italic">
                  "{globalQuote || "La excelencia comienza con un reloj sincronizado. Ser puntuales es nuestra carta de presentación."}"
                </p>
                {(user?.role === 'ADMIN') && (
                  <button
                    onClick={() => setIsEditingQuote(true)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-zinc-300 hover:text-primary hover:bg-white rounded-full transition-all shrink-0 shadow-sm border border-zinc-100"
                    title="Editar frase del día"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Progreso del mes"
            value={`${stats.progresoMes}%`}
            unit={`${stats.completedInMonth || 0}/${stats.totalCreatedInMonth || 0} tareas`}
            icon="analytics"
            progress={stats.progresoMes}
          />
          <MetricCard
            label="Total realizados"
            value={stats.totalRealizados}
            unit="histórico"
            icon="verified"
          />
          <div className="flex h-full flex-col justify-center rounded-[12px] border border-primary/20 bg-white p-6 shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-primary mb-2">Cartelera Digital</h3>
              <p className="text-sm text-zinc-500 mb-4 leading-relaxed">Comparte información importante con todo el equipo.</p>
              <button
                onClick={() => setIsAnnounceModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-[12px] text-xs font-bold hover:bg-primary-hover transition-all active:scale-95"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-lg">add</span>
                Nuevo Anuncio
              </button>
            </div>
            <div className="absolute top-[-20%] right-[-10%] size-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Announcements Feed */}
          <section aria-labelledby="announcements-title" className="bg-white rounded-[12px] border border-zinc-200 p-6 shadow-sm min-w-0">
            <div className="flex items-center justify-between mb-5">
              <h2 id="announcements-title" className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span aria-hidden="true" className="material-symbols-outlined text-primary">campaign</span>
                Anuncios
              </h2>
            </div>
            <div className="flex flex-col relative">
              <div className="min-h-[120px] max-h-[280px] overflow-y-auto pr-1 custom-scrollbar space-y-4">
                {announcements.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-zinc-200 text-[48px] mb-4">notifications_off</span>
                    <p className="text-sm text-zinc-400 font-medium italic">No hay anuncios recientes</p>
                  </div>
                ) : (
                  announcements.map(ann => (
                    <AnnouncementItem
                      key={ann.id}
                      id={ann.id}
                      content={ann.contenido}
                      type={ann.tipo}
                      author={ann.author}
                      date={ann.createdAt}
                      onDelete={handleDeleteAnnouncement}
                      canDelete={user?.role === 'ADMIN' || user?.id === ann.authorId}
                    />
                  ))
                )}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-stretch">
            <InventoryAlertWidget alerts={activeInventoryAlerts} />
          {/* Recent Achievements */}
          <section aria-labelledby="achievements-title" className="bg-white rounded-[12px] border border-zinc-200 p-6 shadow-sm min-w-0 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h2 id="achievements-title" className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span aria-hidden="true" className="material-symbols-outlined text-alert">emoji_events</span>
                Logros Recientes
              </h2>
            </div>
            <div className="flex-1 flex flex-col relative overflow-hidden">
              <div className="max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                <div className="relative space-y-6">
                  {/* Vertical Timeline Line */}
                  {stats.logrosRecientes.length > 1 && (
                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-zinc-100 z-0"></div>
                  )}

                  {stats.logrosRecientes.length === 0 ? (
                    <p className="text-center py-8 text-xs text-zinc-400 font-medium italic">Sin logros registrados esta semana</p>
                  ) : (
                    stats.logrosRecientes.slice(0, 5).map((logro) => (
                      <div key={logro.id} className="flex items-start gap-3 relative z-10 group">
                        <SharedUserAvatar user={logro.user} size={32} className="ring-4 ring-white" />
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                            {toTitleCase(logro.user.nombre)} completó:
                          </p>
                          <p className="text-sm font-black text-zinc-900 mb-1 leading-tight">{logro.titulo}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-zinc-300">
                               {new Date(logro.updatedAt).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                            {logro.client && (
                              <>
                                <span className="text-[10px] text-zinc-200">•</span>
                                <span className="text-[10px] font-bold text-zinc-400 truncate max-w-[150px]">
                                  {logro.client.razon_social}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-auto pt-4">
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="w-full py-4 border-t border-zinc-50 text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary-hover flex items-center justify-center gap-2 transition-all hover:gap-3"
                >
                  Ver historial del día <span aria-hidden="true" className="material-symbols-outlined text-[16px]">arrow_outward</span>
                </button>
              </div>
            </div>
          </section>
          </div>
        </div>
      </div>

      <AnnouncementModal
        isOpen={isAnnounceModalOpen}
        onClose={() => setIsAnnounceModalOpen(false)}
        onCreated={fetchDashboardData}
      />

      {isHistoryModalOpen && <HistoryModal
        isOpen
        onClose={() => setIsHistoryModalOpen(false)}
      />}
    </div>
  );
};

export default Dashboard;
