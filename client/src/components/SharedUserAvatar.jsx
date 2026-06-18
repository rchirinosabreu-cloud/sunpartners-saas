import { useState, memo } from 'react';
import Avatar from 'boring-avatars';

const DEFAULT_COLORS = ['#5486A1', '#FBAE17', '#222222', '#F2F2F2', '#EAEAEA'];

const SharedUserAvatar = memo(({
  user,
  size = 40,
  colors = DEFAULT_COLORS,
  className = '',
  variant = 'beam',
  title = ''
}) => {
  const [imgError, setImgError] = useState(false);
  const name = user?.nombre || 'Sin asignar';
  const hasPhoto = !!user?.fotoPerfilUrl && !imgError;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full border-2 border-white bg-zinc-50 shadow-sm shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title={title || name}
    >
      {hasPhoto ? (
        <img
          src={user.fotoPerfilUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <Avatar size={size} name={name} variant={variant} colors={colors} />
      )}
    </div>
  );
});

export default SharedUserAvatar;
