import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isBefore, startOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

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
    opacity: isDragging ? 0.5 : task.status === 'REALIZADO' ? 0.7 : 1,
  };

  const nowColombia = toZonedTime(new Date(), COLOMBIA_TZ);
  const isExpired = task.status !== 'REALIZADO' && isBefore(new Date(task.fechaLimite), startOfDay(nowColombia));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative bg-white p-4 rounded-xl shadow-sm border-2 transition-all cursor-pointer group
        ${task.isPriority ? 'border-l-[2px] border-l-red-500 border-zinc-100' : 'border-zinc-100 hover:border-primary/30'}
        ${isDragging ? 'z-50 shadow-xl scale-105' : ''}
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
          <h4 className="font-bold text-zinc-900 text-[13px] leading-tight uppercase line-clamp-2">{task.titulo}</h4>
          {task.client && (
            <p className="text-[11px] font-black text-primary uppercase mt-1 tracking-tight">{task.client.razon_social}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-black text-white uppercase" title={task.user?.nombre}>
              {task.user?.username?.substring(0, 2) || task.user?.nombre?.substring(0, 2) || '??'}
            </div>
            {task.isPriority && (
              <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase tracking-widest">ALTA</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
             <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${isExpired ? 'bg-red-50 text-red-600' : 'bg-zinc-50 text-zinc-400'}`}>
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                {format(new Date(task.fechaLimite), 'dd/MM')}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;
