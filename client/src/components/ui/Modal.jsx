import React from 'react';

const Modal = ({ isOpen, onClose, title, children, type = 'info' }) => {
  if (!isOpen) return null;

  const typeStyles = {
    info: 'border-primary',
    error: 'border-red-500',
    success: 'border-green-500',
    warning: 'border-brand-alert'
  };

  const iconMap = {
    info: 'info',
    error: 'error',
    success: 'check_circle',
    warning: 'warning'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white border-2 ${typeStyles[type]} w-full max-w-md rounded-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`material-symbols-outlined ${type === 'error' ? 'text-red-500' : type === 'success' ? 'text-green-500' : type === 'warning' ? 'text-brand-alert' : 'text-primary'}`}>
              {iconMap[type]}
            </span>
            <h3 className="font-display text-lg font-black uppercase tracking-tight text-zinc-900">{title}</h3>
          </div>
          <div className="text-sm text-zinc-600 font-medium leading-relaxed">
            {children}
          </div>
        </div>
        <div className="bg-zinc-50 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-zinc-900 text-white px-6 py-2 rounded-sm text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
