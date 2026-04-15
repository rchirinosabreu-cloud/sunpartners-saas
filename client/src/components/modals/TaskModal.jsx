import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../ui/Modal';
import { formatInTimeZone, toDate } from 'date-fns-tz';

const COLOMBIA_TZ = 'America/Bogota';

const TaskModal = ({ isOpen, onClose, onTaskCreated, editingTask }) => {
  const getTodayColombia = () => formatInTimeZone(new Date(), COLOMBIA_TZ, 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    titulo: '',
    clientId: '',
    userId: '',
    fechaLimite: getTodayColombia(),
    isPriority: false,
    isImprorrogable: false,
    comentarios: '',
    status: 'PENDIENTE'
  });

  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  // States for interceptors
  const [reasonModal, setReasonModal] = useState({ isOpen: false, type: null, value: '' });
  const [pendingUserUpdate, setPendingUserUpdate] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const [cRes, uRes] = await Promise.all([
          axios.get('/api/clients'),
          axios.get('/api/users')
        ]);
        setClients(cRes.data);
        setUsers(uRes.data);
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingTask) {
      setFormData({
        ...editingTask,
        clientId: editingTask.clientId || '',
        fechaLimite: formatInTimeZone(new Date(editingTask.fechaLimite), COLOMBIA_TZ, 'yyyy-MM-dd')
      });
    } else {
      setFormData({
        titulo: '',
        clientId: '',
        userId: '',
        fechaLimite: getTodayColombia(),
        isPriority: false,
        comentarios: '',
        status: 'PENDIENTE',
        isImprorrogable: false
      });
    }
  }, [editingTask]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Forzar 00:00:00 en Colombia
      const colombiaDate = toDate(`${formData.fechaLimite}T00:00:00`, { timeZone: COLOMBIA_TZ });

      const payload = {
        ...formData,
        clientId: formData.clientId || null,
        fechaLimite: colombiaDate.toISOString()
      };

      if (editingTask) {
        await axios.put(`/api/tasks/${editingTask.id}`, payload);
      } else {
        await axios.post('/api/tasks', payload);
      }
      onTaskCreated();
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleDelete = async () => {
    if (!editingTask || !reasonModal.value.trim()) return;
    try {
      await axios.delete(`/api/tasks/${editingTask.id}`, {
        data: { justification: reasonModal.value }
      });
      onTaskCreated();
      setReasonModal({ isOpen: false, type: null, value: '' });
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleResponsibleChange = (newUserId) => {
    if (editingTask && newUserId !== editingTask.userId) {
       setPendingUserUpdate(newUserId);
       setReasonModal({ isOpen: true, type: 'reassign', value: '' });
    } else {
       setFormData({ ...formData, userId: newUserId });
    }
  };

  const confirmReassignment = () => {
    if (!reasonModal.value.trim()) return;
    setFormData(prev => ({
      ...prev,
      userId: pendingUserUpdate,
      comentarios: (prev.comentarios ? prev.comentarios + '\n\n' : '') + `[REASIGNACIÓN] Motivo: ${reasonModal.value}`
    }));
    setReasonModal({ isOpen: false, type: null, value: '' });
    setPendingUserUpdate(null);
  };

  return (
    <>
    {/* Sub-modal for Justification Interceptors */}
    <Modal
      isOpen={reasonModal.isOpen}
      onClose={() => {
        setReasonModal({ isOpen: false, type: null, value: '' });
        setPendingUserUpdate(null);
      }}
      title={reasonModal.type === 'delete' ? 'Motivo de eliminación' : 'Motivo de reasignación'}
      type="warning"
      action={{
        label: 'Confirmar',
        onClick: reasonModal.type === 'delete' ? handleDelete : confirmReassignment,
        color: reasonModal.type === 'delete' ? 'danger' : 'primary',
        disabled: !reasonModal.value.trim()
      }}
    >
      <div className="space-y-4">
        <p className="text-[11px] font-bold text-zinc-500 uppercase">
          Esta acción requiere una justificación obligatoria:
        </p>
        <textarea
          autoFocus
          required
          className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs resize-none"
          rows="3"
          placeholder="Escribe el motivo aquí..."
          value={reasonModal.value}
          onChange={(e) => setReasonModal({ ...reasonModal, value: e.target.value })}
        />
      </div>
    </Modal>

    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
      type="info"
      showFooter={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-2">
        <div className="space-y-1">
          <label className="block text-[10px] font-black tracking-widest text-zinc-400">Título de la tarea</label>
          <input
            required
            className="w-full h-11 border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
            placeholder="Ej: Preparar cronograma evento X"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-black tracking-widest text-zinc-400">Cliente</label>
            <select
              className="w-full h-11 border-2 border-zinc-100 rounded-lg px-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
              value={formData.clientId || ''}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value || null })}
            >
              <option value="">Ninguno / No aplica</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black tracking-widest text-zinc-400">Responsable</label>
            <select
              required
              className="w-full h-11 border-2 border-zinc-100 rounded-lg px-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
              value={formData.userId}
              onChange={(e) => handleResponsibleChange(e.target.value)}
            >
              <option value="">Seleccionar Responsable</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-black tracking-widest text-zinc-400">Fecha límite</label>
            <input
              required
              type="date"
              className="w-full h-11 border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
              value={formData.fechaLimite}
              onChange={(e) => setFormData({ ...formData, fechaLimite: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black tracking-widest text-zinc-400">Estado inicial</label>
            <select
              className="w-full h-11 border-2 border-zinc-100 rounded-lg px-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN_PROCESO">EN PROCESO</option>
              <option value="REALIZADO">REALIZADO</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-black tracking-widest text-zinc-400">Comentarios operativos</label>
          <textarea
            className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs resize-none"
            rows="3"
            placeholder="Instrucciones o notas adicionales..."
            value={formData.comentarios}
            onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border-2 border-zinc-100">
             <input
               type="checkbox"
               id="isPriority"
               className="w-4 h-4 rounded-sm border-2 border-zinc-200 text-primary accent-primary"
               checked={formData.isPriority}
               onChange={(e) => setFormData({ ...formData, isPriority: e.target.checked })}
             />
             <label htmlFor="isPriority" className="text-[11px] font-black uppercase tracking-widest text-zinc-600 cursor-pointer">Prioritario</label>
          </div>

          <div
            className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border-2 border-zinc-100 group relative"
            title="Si se vence, la tarea se marcará como incumplida y no podrá completarse"
          >
             <input
               type="checkbox"
               id="isImprorrogable"
               className="w-4 h-4 rounded-sm border-2 border-zinc-200 text-primary accent-primary"
               checked={formData.isImprorrogable}
               onChange={(e) => setFormData({ ...formData, isImprorrogable: e.target.checked })}
             />
             <label htmlFor="isImprorrogable" className="text-[11px] font-black uppercase tracking-widest text-zinc-600 cursor-pointer">Improrrogable</label>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 pt-6 border-t border-zinc-100 mt-4">
          {editingTask && (
            <button
              type="button"
              onClick={() => setReasonModal({ isOpen: true, type: 'delete', value: '' })}
              className="mr-auto w-10 h-10 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
              title="Eliminar Tarea"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          )}
          <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-[10px] font-black tracking-widest text-zinc-500 hover:bg-zinc-100 transition-colors">Cancelar</button>
          <button type="submit" className="bg-primary text-white px-10 py-3 rounded-lg text-[11px] font-black tracking-widest hover:opacity-90 shadow-lg transition-all">{editingTask ? 'Actualizar' : 'Crear tarea'}</button>
        </div>
      </form>
    </Modal>
    </>
  );
};

export default TaskModal;
