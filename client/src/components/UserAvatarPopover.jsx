import { useState } from 'react';
import { createPortal } from 'react-dom';
import Avatar from 'boring-avatars';
import { toTitleCase } from '../utils/formatters';

const DEFAULT_COLORS = ['#5486A1', '#FBAE17', '#222222', '#F2F2F2', '#EAEAEA'];

const UserAvatarPopover = ({
  user,
  relationship = 'Miembro del equipo',
  size = 28,
  colors = DEFAULT_COLORS,
  className = '',
}) => {
  const [position, setPosition] = useState(null);
  const name = user?.nombre || 'Sin asignar';

  const showPopover = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const popoverWidth = 224;
    const left = Math.min(
      Math.max(12, rect.left + rect.width / 2 - popoverWidth / 2),
      window.innerWidth - popoverWidth - 12,
    );

    const popoverHeight = 140;
    const top = rect.bottom + popoverHeight + 12 > window.innerHeight
      ? Math.max(12, rect.top - popoverHeight - 8)
      : rect.bottom + 8;

    setPosition({ left, top });
  };

  const hidePopover = () => setPosition(null);

  return (
    <>
      <span
        aria-label={`Ver información de ${name}`}
        className={`relative inline-flex shrink-0 cursor-help ${className}`}
        onMouseEnter={showPopover}
        onMouseLeave={hidePopover}
        onFocus={showPopover}
        onBlur={hidePopover}
        tabIndex={0}
      >
        <span
          className="flex items-center justify-center overflow-hidden rounded-full border-2 border-white bg-zinc-50 shadow-sm"
          style={{ width: size, height: size }}
        >
          <Avatar size={size} name={name} variant="beam" colors={colors} />
        </span>
      </span>

      {position && createPortal(
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[9999] w-56 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-xl"
          style={{ left: position.left, top: position.top }}
        >
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-zinc-50 shadow-sm">
              <Avatar size={40} name={name} variant="beam" colors={colors} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-900">{toTitleCase(name)}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">{relationship}</p>
            </div>
          </div>
          {(user?.username || user?.role) && (
            <div className="mt-3 border-t border-zinc-100 pt-2 text-[11px] text-zinc-500">
              {user?.username && <p className="truncate">@{user.username}</p>}
              {user?.role && <p className="mt-0.5 font-bold uppercase tracking-wider">{user.role}</p>}
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  );
};

export default UserAvatarPopover;
