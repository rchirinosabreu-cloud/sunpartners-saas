import React from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children, type = 'info', action = null, showFooter = true, zIndexClass = "z-[100]" }) => {
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

  return createPortal(
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200 font-body`}>
      <div className={`bg-white border-2 ${typeStyles[type]} w-full max-w-md rounded-[12px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${type === 'error' ? 'bg-red-50' : type === 'success' ? 'bg-green-50' : type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'}`}>
              <span className={`material-symbols-outlined text-[28px] ${type === 'error' ? 'text-red-500' : type === 'success' ? 'text-green-500' : type === 'warning' ? 'text-brand-alert' : 'text-primary'}`}>
                {iconMap[type]}
              </span>
            </div>
            <h3 className="font-display text-xl font-black tracking-tight text-zinc-900 leading-tight">{title}</h3>
          </div>
          <div className="text-[13px] text-zinc-600 font-semibold leading-relaxed mb-2">
            {children}
          </div>
        </div>
        {showFooter && (
        <div className="bg-zinc-50/80 px-8 py-5 flex items-center justify-end gap-3 border-t border-zinc-100">
          {action ? (
            <>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg text-[11px] font-black tracking-widest text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-all"
              >
                Cancelar
              </button>
              <button
                disabled={action.disabled}
                onClick={action.onClick}
                className={`px-8 py-3 rounded-lg text-[11px] font-black tracking-widest text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${action.color === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-primary hover:opacity-90 shadow-primary/20'}`}
              >
                {action.label}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="bg-zinc-900 text-white px-10 py-3 rounded-lg text-[11px] font-black tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
            >
              Entendido
            </button>
          )}
        </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
