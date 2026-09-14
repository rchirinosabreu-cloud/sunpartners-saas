import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from '../components/kanban/KanbanColumn';
import KanbanCard from '../components/kanban/KanbanCard';
import TaskModal from '../components/modals/TaskModal';
import Modal from '../components/ui/Modal';
import { toTitleCase } from '../utils/formatters';
import confetti from 'canvas-confetti';
import { motion as Motion } from 'framer-motion';
import {
  getCurrentBogotaMonth,
  getCurrentBogotaMonthLabel,
  resolveDropStatus,
  TASK_STATUSES,
} from '../utils/kanbanDragLogic';

const Kanban = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isCemeteryOpen, setIsCemeteryOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [initialStatus, setInitialStatus] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [filters, setFilters] = useState({ userId: '', clientId: '', showToday: false });
  const [users, setUsers] = useState([]);
  const [dragError, setDragError] = useState('');
  const dragTargetStatusRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchTasks = async () => {
    try {
      const completedMonth = getCurrentBogotaMonth();
      const res = await axios.get('/api/tasks', { params: { completedMonth } });
      setTasks(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      const uRes = await axios.get('/api/users');
      setUsers(uRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchData();
  }, []);

  const handleDragStart = (event) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) {
      setInitialStatus(task.status);
      dragTargetStatusRef.current = task.status;
    }
    setDragError('');
    setSnapshot([...tasks]);
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const overTask = tasks.find(t => t.id === overId);
    const targetStatus = resolveDropStatus({
      activeId,
      overId,
      tasks,
      lastTargetStatus: dragTargetStatusRef.current,
    });
    if (!targetStatus) return;
    dragTargetStatusRef.current = targetStatus;

    // CASO A: Arrastrar sobre una COLUMNA vacía
    if (TASK_STATUSES.includes(overId)) {
       if (activeTask.status !== overId) {
          setTasks(prev => {
            const newTasks = [...prev];
            const idx = newTasks.findIndex(t => t.id === activeId);
            newTasks[idx] = { ...newTasks[idx], status: overId };
            return newTasks;
          });
       }
       return;
    }

    // CASO B: Arrastrar sobre otra TARJETA
    if (overTask && activeId !== overId) {
       const overStatus = targetStatus;

       if (activeTask.status !== overStatus) {
          setTasks(prev => {
             const newTasks = [...prev];
             const activeIdx = newTasks.findIndex(t => t.id === activeId);
             newTasks[activeIdx] = { ...newTasks[activeIdx], status: overStatus };

             // Mover posición localmente
             const oldIndex = newTasks.findIndex(t => t.id === activeId);
             const newIndex = newTasks.findIndex(t => t.id === overId);
             return arrayMove(newTasks, oldIndex, newIndex);
          });
       } else {
          // Solo reordenar en la misma columna
          const oldIndex = tasks.findIndex(t => t.id === activeId);
          const newIndex = tasks.findIndex(t => t.id === overId);
          if (oldIndex !== newIndex) {
             setTasks(prev => arrayMove(prev, oldIndex, newIndex));
          }
       }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) {
      if (snapshot) setTasks(snapshot);
      setInitialStatus(null);
      setSnapshot(null);
      dragTargetStatusRef.current = null;
      return;
    }

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const overId = over.id;
    const newStatus = resolveDropStatus({
      activeId: active.id,
      overId,
      tasks,
      lastTargetStatus: dragTargetStatusRef.current,
    }) || activeTask.status;

    // Persistencia silenciosa (Optimistic UI)
    if (initialStatus !== newStatus || active.id !== over.id) {
        try {
            // Persistir status y orden (basado en el índice local actual)
            const newOrder = tasks.findIndex(t => t.id === active.id);
            const response = await axios.put(`/api/tasks/${activeTask.id}`, {
              status: newStatus,
              order: newOrder
            });
            setTasks(prev => prev.map(task => (
              task.id === activeTask.id ? { ...task, ...response.data } : task
            )));

            if (newStatus === 'REALIZADO' && initialStatus !== 'REALIZADO') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#5486A1', '#FBAE17', '#ffffff']
                });
            }
            setInitialStatus(null);
            setSnapshot(null);
            dragTargetStatusRef.current = null;
        } catch (e) {
            console.error('API Error, rolling back state:', e);
            if (snapshot) setTasks(snapshot);
            setDragError('No se pudo guardar el cambio de estado. La tarea volvió a su columna anterior.');
            setInitialStatus(null);
            setSnapshot(null);
            dragTargetStatusRef.current = null;
        }
    } else {
        // Solo reordenamiento local persistido (si el backend lo soportara)
        setInitialStatus(null);
        setSnapshot(null);
        dragTargetStatusRef.current = null;
    }
  };

  const handleDragCancel = () => {
    if (snapshot) setTasks(snapshot);
    setActiveId(null);
    setInitialStatus(null);
    setSnapshot(null);
    dragTargetStatusRef.current = null;
  };

  const isOverdueByMoreThan24h = (task) => {
    if (!task.isImprorrogable || task.status === 'REALIZADO') return false;
    const now = new Date();
    const deadline = new Date(task.fechaLimite);
    // 24 horas = 24 * 60 * 60 * 1000 ms
    return (now - deadline) > (24 * 60 * 60 * 1000);
  };

  const filteredTasks = tasks.filter(t => {
    // Lógica de Ocultamiento (v16.0): Permanecen 24h con lápida antes de ir al cementerio
    if (isOverdueByMoreThan24h(t)) return false;

    if (filters.userId && t.userId !== filters.userId && t.collaboratorId !== filters.userId) return false;
    if (filters.clientId && t.clientId !== filters.clientId) return false;
    if (filters.showToday) {
        const today = new Date().toISOString().split('T')[0];
        const taskDay = new Date(t.fechaLimite).toISOString().split('T')[0];
        if (today !== taskDay) return false;
    }
    return true;
  });

  const cemeteryTasks = tasks.filter(t => isOverdueByMoreThan24h(t));

  const columns = [
    { id: 'PENDIENTE', title: 'Pendiente' },
    { id: 'EN_PROCESO', title: 'En proceso' },
    { id: 'REALIZADO', title: `Realizados · ${getCurrentBogotaMonthLabel()}` }
  ];

  return (
    <main className="flex-1 flex flex-col h-full bg-white overflow-hidden font-body">
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onTaskCreated={fetchTasks}
        editingTask={editingTask}
      />

      {/* Cemetery Modal */}
      <Modal
        isOpen={isCemeteryOpen}
        onClose={() => setIsCemeteryOpen(false)}
        title="Cementerio de tareas"
        type="error"
      >
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {cemeteryTasks.length === 0 ? (
            <p className="text-center py-8 text-zinc-400 font-bold uppercase text-[10px] tracking-widest">No hay tareas muertas</p>
          ) : (
            cemeteryTasks.map(t => (
              <div key={t.id} className="p-4 border-2 border-zinc-100 rounded-xl bg-zinc-50 flex flex-col gap-2 grayscale opacity-70">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-zinc-900 text-xs">{t.titulo}</h4>
                  <span className="text-xl">🪦</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                   <span>Responsable: {toTitleCase(t.user?.nombre)}</span>
                   <span className="text-red-600">Vencida: {new Date(t.fechaLimite).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Kanban Header */}
      <header className="h-20 border-b border-zinc-100 flex items-center justify-between px-8 bg-white shrink-0 shadow-sm z-20">
        <div className="flex flex-col">
          <h2 className="font-display font-black text-2xl text-zinc-900 tracking-tighter">Tasks</h2>
          <p className="text-[10px] font-black text-zinc-400 tracking-widest leading-none mt-1">Gestión operativa y seguimiento de pendientes</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-lg border border-zinc-100">
             <select
               className="h-9 px-3 bg-white border border-zinc-200 rounded-md text-[11px] font-bold text-zinc-600 outline-none focus:border-primary transition-all min-w-[160px]"
               value={filters.userId}
               onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
             >
               <option value="">Todos los responsables</option>
               {users.map(u => <option key={u.id} value={u.id}>{toTitleCase(u.nombre)} (@{u.username})</option>)}
             </select>


             <button
               onClick={() => setFilters({ ...filters, showToday: !filters.showToday })}
               className={`h-9 px-4 rounded-md text-[10px] font-black tracking-widest transition-all ${filters.showToday ? 'bg-primary text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200 hover:bg-zinc-50'}`}
             >
               Hoy
             </button>
          </div>

          {cemeteryTasks.length > 0 && (
             <button
               onClick={() => setIsCemeteryOpen(true)}
               className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100 shadow-sm"
               title="Ver tareas muertas"
             >
               <span className="text-xl">🪦</span>
             </button>
          )}

          <button
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            className="h-10 px-6 bg-zinc-900 text-white text-[11px] font-black tracking-widest rounded-lg hover:bg-primary transition-all shadow-lg flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_task</span>
            Nueva tarea
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      {dragError && (
        <div role="alert" className="mx-8 mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 shadow-sm">
          {dragError}
        </div>
      )}
      <div className="flex-1 overflow-auto p-8 bg-white flex gap-6 items-start justify-center">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {columns.map(col => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={filteredTasks.filter(t => t.status === col.id)}
              onCardClick={(task) => { setEditingTask(task); setIsModalOpen(true); }}
            />
          ))}

          <DragOverlay adjustScale={true}>
            {activeId ? (
              <Motion.div
                initial={{ scale: 1, rotate: 0 }}
                animate={{
                  scale: 1.05,
                  rotate: 2,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ cursor: 'grabbing' }}
              >
                <KanbanCard
                  task={tasks.find(t => t.id === activeId)}
                  onClick={() => {}}
                />
              </Motion.div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </main>
  );
};

export default Kanban;
