import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Avatar from 'boring-avatars';
import { toTitleCase } from '../../utils/formatters';

const HistoryModal = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    userId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.date) {
        queryParams.append('startDate', filters.date);
        queryParams.append('endDate', filters.date);
      }
      if (filters.userId) queryParams.append('userId', filters.userId);

      const [historyRes, usersRes] = await Promise.all([
        fetch(`/api/tasks/history?${queryParams.toString()}`),
        fetch('/api/users')
      ]);

      if (historyRes.ok) setHistory(await historyRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, filters]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historial de Tareas"
      showFooter={false}
      zIndexClass="z-[100]"
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-6 w-full max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Filters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Filtrar por Día</label>
            <input
              type="date"
              className="w-full text-xs p-2 rounded-lg border border-zinc-100 bg-zinc-50 focus:border-primary transition-all"
              value={filters.date}
              onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Miembro</label>
            <select
              className="w-full text-xs p-2 rounded-lg border border-zinc-100 bg-zinc-50"
              value={filters.userId}
              onChange={(e) => setFilters(f => ({ ...f, userId: e.target.value }))}
            >
              <option value="">Todos</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{toTitleCase(u.nombre)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-zinc-400 text-xs">Cargando historial...</div>
        ) : history.length === 0 ? (
          <div className="py-20 text-center text-zinc-400 text-xs">No se encontraron tareas completadas.</div>
        ) : (
          <div className="space-y-8">
            {history.map((group) => (
              <div key={group.worker.id} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-50 pb-2">
                  <div className="size-8 rounded-lg overflow-hidden border border-zinc-200">
                    <Avatar size={32} name={group.worker.nombre} variant="beam" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900">{toTitleCase(group.worker.nombre)}</h4>
                  <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full ml-auto">
                    {group.tasks.length} tareas
                  </span>
                </div>
                <div className="grid gap-2">
                  {group.tasks.map(task => (
                    <div key={task.id} className="bg-zinc-50/50 p-3 rounded-xl border border-zinc-100 flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-zinc-800">{task.titulo}</p>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {task.client?.razon_social || 'Sin cliente'} • {new Date(task.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default HistoryModal;
