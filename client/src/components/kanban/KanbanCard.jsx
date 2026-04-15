import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isBefore, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { normalizeData, toTitleCase } from '../../utils/formatters';
import Avatar from "boring-avatars";
import { CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

const COLOMBIA_TZ = 'America/Bogota';

const KanbanCard = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : task.status === 'REALIZADO' ? 0.7 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const nowColombia = toZonedTime(new Date(), COLOMBIA_TZ);
  const isExpired = task.status !== 'REALIZADO' && isBefore(new Date(task.fechaLimite), startOfDay(nowColombia));

  return (
    <motion.div
      layout
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98, rotate: '1deg', skew: '1deg' }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        layout: { duration: 0.2 }
      }}
      className={`
        relative bg-white p-4 rounded-xl transition-shadow cursor-pointer group
        ${task.isPriority ? 'border-l-[2px] border-l-red-500 border-2 border-zinc-100 shadow-sm' : 'border-2 border-zinc-100 shadow-sm hover:border-primary/30'}
        ${isDragging ? 'shadow-none border-dashed border-zinc-300' : ''}
      `}
      onClick={() => onClick(task)}
    >
      {isExpired && (
        <div className="absolute -top-3 -right-3 text-4xl z-10 animate-floating select-none" title="Tarea Vencida">
          💀
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="pr-6">
          <h4 className="font-bold text-zinc-900 text-[13px] leading-tight line-clamp-2">{normalizeData(task.titulo)}</h4>
          {task.client && (
            <p className="text-[11px] font-black text-primary mt-1 tracking-tight">{toTitleCase(task.client.razon_social)}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-50">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full overflow-hidden border border-zinc-100 flex items-center justify-center bg-zinc-50" title={task.user?.nombre || 'Sin asignar'}>
              <Avatar
                size={28}
                name={task.user?.nombre || 'Guest'}
                variant="beam"
                colors={['#5486A1', '#FBAE17', '#222222', '#F2F2F2', '#EAEAEA']}
              />
            </div>
            {task.isPriority && (
              <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-widest">ALTA</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
             <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${isExpired ? 'bg-red-50 text-red-600' : 'bg-zinc-50 text-zinc-400'}`}>
                <CalendarDays className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : 'text-zinc-400'}`} />
                {format(new Date(task.fechaLimite), 'dd/MM')}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default KanbanCard;
