import { useState, useEffect } from 'react';
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
import { toSentenceCase } from '../utils/formatters';

const Kanban = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [initialStatus, setInitialStatus] = useState(null);
  const [filters, setFilters] = useState({ userId: '', clientId: '', showToday: false });
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/clients')
      ]);
      setUsers(uRes.data);
      setClients(cRes.data);
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
    if (task) setInitialStatus(task.status);
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overId = over.id;

    // Moving to a column
    if (['PENDIENTE', 'EN_PROCESO', 'REALIZADO'].includes(overId)) {
       if (activeTask.status !== overId) {
          setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: overId } : t));
       }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overId = over.id;
    let newStatus = activeTask.status;

    if (['PENDIENTE', 'EN_PROCESO', 'REALIZADO'].includes(overId)) {
        newStatus = overId;
    } else {
        const overTask = tasks.find(t => t.id === overId);
        if (overTask) newStatus = overTask.status;
    }

    if (initialStatus !== newStatus) {
        try {
            await axios.put(`/api/tasks/${activeTask.id}`, { status: newStatus });
            setInitialStatus(null);
            fetchTasks();
        } catch (e) {
            console.error(e);
            setInitialStatus(null);
            fetchTasks(); // Revert on error
        }
    } else if (active.id !== over.id) {
        // Reordering within the same column (Frontend only for now)
        const oldIndex = tasks.findIndex(t => t.id === active.id);
        const newIndex = tasks.findIndex(t => t.id === over.id);
        setTasks(prev => arrayMove(prev, oldIndex, newIndex));
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filters.userId && t.userId !== filters.userId) return false;
    if (filters.clientId && t.clientId !== filters.clientId) return false;
    if (filters.showToday) {
        const today = new Date().toISOString().split('T')[0];
        const taskDay = new Date(t.fechaLimite).toISOString().split('T')[0];
        if (today !== taskDay) return false;
    }
    return true;
  });

  const columns = [
    { id: 'PENDIENTE', title: 'Pendiente' },
    { id: 'EN_PROCESO', title: 'En Proceso' },
    { id: 'REALIZADO', title: 'Realizado' }
  ];

  return (
    <main className="flex-1 flex flex-col h-full bg-white overflow-hidden font-body">
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onTaskCreated={fetchTasks}
        editingTask={editingTask}
      />

      {/* Kanban Header */}
      <header className="h-20 border-b border-zinc-100 flex items-center justify-between px-8 bg-white shrink-0 shadow-sm z-20">
        <div className="flex flex-col">
          <h2 className="font-display font-black text-2xl text-zinc-900 tracking-tighter">Tablero Kanban</h2>
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
               {users.map(u => <option key={u.id} value={u.id}>{u.nombre} (@{u.username})</option>)}
             </select>

             <select
               className="h-9 px-3 bg-white border border-zinc-200 rounded-md text-[11px] font-bold text-zinc-600 outline-none focus:border-primary transition-all min-w-[160px]"
               value={filters.clientId}
               onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
             >
               <option value="">Todos los clientes</option>
               {clients.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
             </select>

             <button
               onClick={() => setFilters({ ...filters, showToday: !filters.showToday })}
               className={`h-9 px-4 rounded-md text-[10px] font-black tracking-widest transition-all ${filters.showToday ? 'bg-primary text-white shadow-md' : 'bg-white text-zinc-400 border border-zinc-200 hover:bg-zinc-50'}`}
             >
               Hoy
             </button>
          </div>

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
      <div className="flex-1 overflow-x-auto p-8 bg-white flex gap-6 scrollbar-hide items-start">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
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

          <DragOverlay>
            {activeId ? (
              <KanbanCard
                task={tasks.find(t => t.id === activeId)}
                onClick={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </main>
  );
};

export default Kanban;
