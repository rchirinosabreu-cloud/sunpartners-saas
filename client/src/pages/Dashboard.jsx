import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toTitleCase } from '../utils/formatters';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Avatar from 'boring-avatars';
import axios from 'axios';

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
      <div className="size-10 rounded-lg overflow-hidden shrink-0 border border-white shadow-sm">
        <Avatar size={40} name={author.nombre} variant="beam" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-bold text-zinc-900 truncate">{toTitleCase(author.nombre)}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium opacity-60">
              {new Date(date).toLocaleDateString()}
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

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ progresoMes: 0, totalRealizados: 0, logrosRecientes: [] });
  const [announcements, setAnnouncements] = useState([]);
  const [globalQuote, setGlobalQuote] = useState('');
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [editQuoteValue, setEditQuoteValue] = useState('');
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, annRes, quoteRes] = await Promise.all([
        fetch('/api/tasks/dashboard-stats'),
        fetch('/api/announcements'),
        axios.get('/api/settings/global_motivational_quote')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData);
      }

      if (quoteRes.data) {
        setGlobalQuote(quoteRes.data.value);
        setEditQuoteValue(quoteRes.data.value);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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
    <div className="p-8 pb-16 bg-zinc-50/30 min-h-full font-body">
      <div className="mx-auto max-w-7xl space-y-12">

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
          <div className="flex h-full flex-col justify-center rounded-xl bg-zinc-900 p-8 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Cartelera Digital</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">Comparte anuncios, logros o información importante con todo el equipo.</p>
              <button
                onClick={() => setIsAnnounceModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-alert text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Nuevo Anuncio
              </button>
            </div>
            <div className="absolute top-[-20%] right-[-10%] size-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Announcements Feed */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">campaign</span>
                Anuncios
              </h2>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-8 shadow-sm h-[600px] flex flex-col relative overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
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
          </div>

          {/* Recent Achievements */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">emoji_events</span>
                Logros Recientes
              </h2>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-8 shadow-sm h-[600px] flex flex-col relative overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="relative space-y-6">
                  {/* Vertical Timeline Line */}
                  {stats.logrosRecientes.length > 1 && (
                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-zinc-100 z-0"></div>
                  )}

                  {stats.logrosRecientes.length === 0 ? (
                    <p className="text-center py-8 text-xs text-zinc-400 font-medium italic">Sin logros registrados esta semana</p>
                  ) : (
                    stats.logrosRecientes.slice(0, 5).map((logro, idx) => (
                      <div key={logro.id} className="flex items-start gap-3 relative z-10 group">
                        <div className="size-8 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm ring-4 ring-white">
                           <Avatar size={32} name={logro.user.nombre} variant="beam" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                            {toTitleCase(logro.user.nombre)} completó:
                          </p>
                          <p className="text-sm font-black text-zinc-900 mb-1 leading-tight">{logro.titulo}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-zinc-300">
                               {new Date(logro.updatedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
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

              <div className="pt-4">
                <button
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="w-full py-4 border-t border-zinc-50 text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary-hover flex items-center justify-center gap-2 transition-all hover:gap-3"
                >
                  Ver historial completo <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnnouncementModal
        isOpen={isAnnounceModalOpen}
        onClose={() => setIsAnnounceModalOpen(false)}
        onCreated={fetchDashboardData}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
