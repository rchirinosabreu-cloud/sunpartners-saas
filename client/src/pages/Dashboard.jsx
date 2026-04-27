import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toTitleCase } from '../utils/formatters';
import Avatar from 'boring-avatars';
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
        <span className="inline-block mt-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-white/50 border border-current opacity-40">
          {type}
        </span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ progresoMes: 0, totalRealizados: 0, logrosRecientes: [] });
  const [announcements, setAnnouncements] = useState([]);
  const [isAnnounceModalOpen, setIsAnnounceModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, annRes] = await Promise.all([
        fetch('/api/tasks/dashboard-stats'),
        fetch('/api/announcements')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData);
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
          <span className="text-sm font-medium text-zinc-400">Ojo al dato: Sincronizando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 pb-16 bg-zinc-50/30 min-h-full">
      <div className="mx-auto max-w-7xl space-y-8">

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Announcements Feed */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">campaign</span>
                Anuncios del Equipo
              </h2>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {announcements.length === 0 ? (
                <div className="py-20 text-center rounded-2xl border-2 border-dashed border-zinc-100 bg-white">
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

          {/* Recent Achievements */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-green-500">emoji_events</span>
                Logros Recientes
              </h2>
            </div>
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm space-y-6">
              <div className="space-y-4">
                {stats.logrosRecientes.length === 0 ? (
                  <p className="text-center py-8 text-xs text-zinc-400 font-medium italic">Sin logros registrados esta semana</p>
                ) : (
                  stats.logrosRecientes.map(logro => (
                    <div key={logro.id} className="flex items-center gap-3 group">
                      <div className="size-2 rounded-full bg-green-400 shrink-0 group-hover:scale-150 transition-transform"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-zinc-800 truncate">{logro.titulo}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">por {toTitleCase(logro.user.nombre)}</p>
                      </div>
                      <span className="text-[10px] font-medium text-zinc-400">
                        {new Date(logro.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="w-full py-4 border-t border-zinc-50 text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary-hover flex items-center justify-center gap-2 transition-colors"
              >
                Ver historial completo <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
              </button>
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
