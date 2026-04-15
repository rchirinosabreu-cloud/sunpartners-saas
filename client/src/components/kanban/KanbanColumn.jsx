import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';
import { motion } from 'framer-motion';

const KanbanColumn = ({ id, title, tasks, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className={`flex flex-col w-full min-w-[320px] max-w-[400px] bg-slate-50/50 p-5 rounded-2xl border-2 transition-all shadow-inner ${isOver ? 'border-primary/40 bg-primary/5 scale-[1.01]' : 'border-transparent'}`}>
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="font-display font-black text-zinc-900 tracking-tighter text-lg flex items-center gap-3">
          {title}
          <span className="bg-white px-2.5 py-0.5 rounded-full border border-zinc-200 text-[11px] font-black text-zinc-400 shadow-sm">{tasks.length}</span>
        </h3>
        <span className="material-symbols-outlined text-zinc-300 text-[20px]">more_horiz</span>
      </div>

      <div ref={setNodeRef} className="flex-1 space-y-4 pb-12">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard key={task.id} task={task} onClick={onCardClick} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
           <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-zinc-200 rounded-xl opacity-40">
             <span className="material-symbols-outlined text-[24px] text-zinc-400">inventory_2</span>
             <p className="text-[10px] font-black tracking-widest text-zinc-400 mt-2">Sin tareas</p>
           </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
