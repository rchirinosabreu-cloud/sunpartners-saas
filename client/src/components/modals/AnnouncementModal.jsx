import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';

const AnnouncementModal = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [contenido, setContenido] = useState('');
  const [tipo, setTipo] = useState('INFO');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!contenido.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contenido,
          tipo,
          authorId: user.id
        }),
      });

      if (response.ok) {
        setContenido('');
        setTipo('INFO');
        onCreated();
        onClose();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear anuncio"
      action={{
        label: loading ? 'Enviando...' : 'Publicar',
        onClick: handleSubmit,
        disabled: loading || !contenido.trim()
      }}
    >
      <div className="space-y-4 py-2">
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Tipo de anuncio
          </label>
          <div className="flex gap-2">
            {['INFO', 'URGENTE', 'LOGRO'].map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  tipo === t
                    ? 'bg-zinc-900 text-white shadow-md'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {t === 'URGENTE' ? 'ATENCIÓN' : t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Contenido
          </label>
          <textarea
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            className="w-full h-32 p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            placeholder="Escribe el anuncio aquí..."
          />
        </div>
      </div>
    </Modal>
  );
};

export default AnnouncementModal;
