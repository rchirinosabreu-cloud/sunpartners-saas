import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { normalizeData, toTitleCase } from '../../utils/formatters';
import UserAvatarPopover from '../UserAvatarPopover';
import { CalendarDays, Zap } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { getKanbanCardStyle, isCardVisuallyDragging } from '../../utils/kanbanDragLogic';

const COLOMBIA_TZ = 'America/Bogota';

const KanbanCard = ({ task, onClick, isOverlay = false, activeId = null }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: isOverlay ? `drag-overlay-${task.id}` : task.id,
    disabled: isOverlay,
  });

  const isVisuallyDragging = isCardVisuallyDragging({
    cardId: task.id,
    activeId,
    isOverlay,
  });

  const style = getKanbanCardStyle({
    isDragging: isVisuallyDragging,
    isCompleted: task.status === 'REALIZADO',
    isOverlay,
    transform: CSS.Translate.toString(transform),
    transition,
  });

  const nowColombia = toZonedTime(new Date(), COLOMBIA_TZ);
  const expirationDate = new Date(task.fechaLimite);
  const isExpired = task.status !== 'REALIZADO' && isBefore(expirationDate, startOfDay(nowColombia));
  const daysOverdue = isExpired ? differenceInDays(nowColombia, expirationDate) : 0;

  const cardBorderClass = task.isImprorrogable
    ? 'border-2 border-red-500 shadow-md'
    : task.isPriority
      ? 'border-2 border-brand-alert shadow-md'
      : 'border-2 border-zinc-100 shadow-sm hover:border-primary/30';

  return (
    <Motion.div
      layout
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98, rotate: '1deg', skew: '1deg' }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        layout: { duration: 0.2 }
      }}
      className={`
        relative bg-white p-4 rounded-xl transition-all cursor-pointer group
        ${cardBorderClass}
        ${isVisuallyDragging ? 'shadow-none border-dashed border-zinc-300' : ''}
        ${isExpired && task.isImprorrogable ? 'grayscale desaturate-[0.8] opacity-80 bg-zinc-50' : ''}
      `}
      onClick={() => !isOverlay && onClick(task)}
    >
      {isExpired && (
        <div className="absolute -top-3 -right-3 text-4xl z-10 animate-floating select-none" title={task.isImprorrogable ? "Tarea Improrrogable Vencida" : "Tarea Vencida"}>
          {task.isImprorrogable ? '🪦' : '💀'}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-zinc-900 text-[13px] leading-tight line-clamp-2 flex-1">{normalizeData(task.titulo)}</h4>
          <div className="flex gap-1 flex-wrap justify-end pt-0.5">
              {task.isPriority && (
                <span className="text-[7px] font-black bg-brand-alert text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 tracking-wider">
                  <Zap size={8} fill="currentColor" />
                  PRIORITARIO
                </span>
              )}
              {task.isImprorrogable && (
                <span className="text-[7px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded tracking-wider">
                  IMPRORROGABLE
                </span>
              )}
          </div>
        </div>

        {task.client && (
          <p className="text-[11px] font-black text-primary mt-1 tracking-tight">{toTitleCase(task.client.razon_social)}</p>
        )}

        <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-50">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <UserAvatarPopover
                user={task.user}
                relationship="Responsable"
                className="z-20"
              />
              {task.collaborator && (
                <UserAvatarPopover
                  user={task.collaborator}
                  relationship="Colaborador"
                  colors={['#FBAE17', '#5486A1', '#EAEAEA', '#F2F2F2', '#222222']}
                  className="z-10"
                />
              )}
            </div>
            <span className="text-sm font-bold text-zinc-800">
               {task.user?.nombre?.split(' ')[0]}
               {task.collaborator && <span className="text-zinc-400 font-medium ml-1"> & {task.collaborator.nombre.split(' ')[0]}</span>}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
             <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${isExpired ? 'bg-red-50 text-red-600' : 'bg-zinc-50 text-zinc-400'}`}>
                <CalendarDays className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : 'text-zinc-400'}`} />
                {format(new Date(task.fechaLimite), 'dd/MM')}
                {isExpired && <span className="ml-0.5">+{daysOverdue}d</span>}
             </div>
          </div>
        </div>
      </div>
    </Motion.div>
  );
};

export default KanbanCard;
