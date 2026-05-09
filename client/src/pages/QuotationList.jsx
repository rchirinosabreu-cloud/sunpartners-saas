import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import { toTitleCase, matchesSearch } from '../utils/formatters';
import Avatar from "boring-avatars";

const QuotationList = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [activePopover, setActivePopover] = useState(null); // { id: string, rect: DOMRect }
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'archived'
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [qToArchive, setQToArchive] = useState(null);
  const [messageModal, setMessageModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });
  const navigate = useNavigate();

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/quotations', {
        params: { archived: activeTab === 'archived' ? 'true' : 'false' },
        withCredentials: true
      });
      if (Array.isArray(res.data)) {
          setQuotations(res.data);
      } else {
          setQuotations([]);
      }
    } catch (err) {
      console.error(err);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [activeTab]);

  const handleArchive = async (id) => {
    try {
      await axios.patch(`/api/quotations/${id}/archive`, {}, { withCredentials: true });
      setMessageModal({
        isOpen: true,
        title: 'Cotización Archivada',
        content: 'La cotización ha sido movida al archivo histórico y el stock reservado ha sido liberado.',
        type: 'success'
      });
      fetchQuotations();
    } catch (err) {
      setMessageModal({
        isOpen: true,
        title: 'Error al archivar',
        content: err.response?.data?.error || 'No se pudo archivar la cotización.',
        type: 'error'
      });
    } finally {
      setQToArchive(null);
    }
  };

  const handleUnarchive = async (id) => {
    try {
      await axios.patch(`/api/quotations/${id}/unarchive`, {}, { withCredentials: true });
      setMessageModal({
        isOpen: true,
        title: 'Cotización Restaurada',
        content: 'La cotización vuelve a estar en la línea de tiempo activa.',
        type: 'success'
      });
      fetchQuotations();
    } catch (err) {
      setMessageModal({
        isOpen: true,
        title: 'Error al desarchivar',
        content: 'No se pudo restaurar la cotización.',
        type: 'error'
      });
    }
  };

  const handleInPlaceStatusChange = async (quotationId, newStatus) => {
    try {
      await axios.put(`/api/quotations/${quotationId}/status`, {
        estado: newStatus,
        details: 'Estado cambiado manualmente por Administrador'
      }, { withCredentials: true });

      setActivePopover(null);
      fetchQuotations();
    } catch (err) {
      setMessageModal({
        isOpen: true,
        title: 'Error al cambiar estado',
        content: err.response?.data?.error || 'No se pudo actualizar el estado.',
        type: 'error'
      });
    }
  };

  const getStatusBadge = (quotation) => {
    const status = quotation.estado;
    const styles = {
      BORRADOR: { style: 'bg-zinc-100 text-zinc-600', label: 'BORRADOR' },
      ENVIADA: { style: 'bg-blue-50 text-blue-600', label: 'ENVIADA' },
      APROBADA: { style: 'bg-green-50 text-green-600', label: 'APROBADA' },
      EJECUCION: { style: 'bg-primary/10 text-primary', label: 'EJECUCIÓN' },
      FINALIZADA: { style: 'bg-green-100 text-green-700', label: 'LEGALIZADA' },
      CANCELADA: { style: 'bg-red-50 text-red-600', label: 'CANCELADA' },
      RECHAZADA: { style: 'bg-red-100 text-red-700', label: 'RECHAZADA' },
      REVISION_SOLICITADA: { style: 'bg-red-50 text-red-600', label: 'CAMBIOS SOLICITADOS' },
      ACCEPTED_PENDING_OC: { style: 'bg-amber-50 text-amber-600', label: 'PENDIENTE OC' }
    };
    const config = styles[status] || { style: 'bg-zinc-100 text-zinc-600', label: status };

    return (
      <span
        onClick={(e) => {
          if (user?.role === 'ADMIN') {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setActivePopover({ id: quotation.id, rect, currentStatus: status });
          }
        }}
        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${config.style} ${user?.role === 'ADMIN' ? 'cursor-pointer hover:ring-2 ring-primary/20 transition-all' : ''}`}
      >
        {config.label}
      </span>
    );
  };

  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const refLabel = q.consecutivo ? `SP-${q.consecutivo}` : `#Q-${q.id.substring(0, 6).toUpperCase()}`;
      return matchesSearch(q.nombre_evento, debouncedSearch) ||
             matchesSearch(q.client.razon_social, debouncedSearch) ||
             matchesSearch(refLabel, debouncedSearch) ||
             (q.consecutivo && matchesSearch(q.consecutivo.toString(), debouncedSearch));
    });
  }, [quotations, debouncedSearch]);

  return (
    <div className="p-8 font-body">
      <Modal
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal({ ...messageModal, isOpen: false })}
        title={messageModal.title}
        type={messageModal.type}
      >
        {messageModal.content}
      </Modal>

      <Modal
        isOpen={!!qToArchive}
        onClose={() => setQToArchive(null)}
        title="Confirmar Archivado"
        type="warning"
        action={{
          label: 'Archivar Cotización',
          onClick: () => handleArchive(qToArchive.id),
          color: 'primary'
        }}
      >
        ¿Estás seguro de archivar la cotización <span className="font-black text-zinc-900">"{qToArchive?.nombre_evento}"</span>?
        Esta acción liberará cualquier reserva de stock y moverá el registro fuera de la vista activa.
      </Modal>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-3xl font-black tracking-tight text-zinc-900">Cotizaciones</h2>
          <p className="text-[13px] text-zinc-500 font-semibold mt-1">Gestión del motor de negocio y eventos históricos.</p>
        </div>
        <button
          onClick={() => navigate('/cotizaciones/nueva')}
          className="flex items-center gap-3 bg-primary text-white px-6 py-3 rounded-lg text-[11px] font-black tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva cotización
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex p-1 bg-zinc-100 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 text-[11px] font-black tracking-widest rounded-md transition-all ${activeTab === 'active' ? 'bg-white text-primary shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Activas
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-6 py-2 text-[11px] font-black tracking-widest rounded-md transition-all ${activeTab === 'archived' ? 'bg-white text-zinc-700 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Archivadas
          </button>
        </div>

        <div className="relative w-full max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[20px]">search</span>
          <input
            type="text"
            placeholder={`Buscar en ${activeTab === 'active' ? 'activas' : 'archivadas'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-white border-2 border-zinc-100 rounded-lg text-xs font-bold text-zinc-900 focus:outline-none focus:border-primary transition-all placeholder:text-zinc-400 shadow-sm"
          />
        </div>
      </div>

      <div className={`bg-white border-2 border-zinc-100 rounded-xl overflow-hidden shadow-sm transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <table className="w-full text-left font-body text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-4">REF</th>
              <th className="px-6 py-4">Evento / Cliente</th>
              <th className="px-6 py-4">Consultor</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {filteredQuotations.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-16 text-center text-zinc-400 font-bold  text-[11px] tracking-widest">
                  {loading ? 'Sincronizando registros...' : `No se encontraron cotizaciones ${activeTab === 'active' ? 'activas' : 'archivadas'}.`}
                </td>
              </tr>
            ) : (
              filteredQuotations.map((q) => (
                <tr
                  key={q.id}
                  className={`hover:bg-zinc-50/80 cursor-pointer transition-all group border-l-4 border-transparent hover:border-primary ${activeTab === 'archived' ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  onClick={() => navigate(`/cotizaciones/${q.id}`)}
                >
                  <td className="px-6 py-5">
                    <span className="text-[11px] font-black text-zinc-500 tracking-widest uppercase">
                      {q.consecutivo ? `SP-${q.consecutivo}` : `#Q-${q.id.substring(0, 6).toUpperCase()}`}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-zinc-900 tracking-tight text-[13px]">{q.nombre_evento}</span>
                      <span className="text-[10px] font-bold text-zinc-400 mt-0.5">{toTitleCase(q.client.razon_social)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className="size-7 rounded-full overflow-hidden flex items-center justify-center border border-zinc-200" title={toTitleCase(q.consultant?.nombre) || 'Sistema'}>
                          <Avatar
                            size={28}
                            name={q.consultant?.nombre || 'System'}
                            variant="beam"
                            colors={['#5486A1', '#FBAE17', '#222222', '#F2F2F2', '#EAEAEA']}
                          />
                       </div>
                       <span className="text-[11px] font-bold text-zinc-600 tracking-tight">{toTitleCase(q.consultant?.nombre) || 'SISTEMA'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-zinc-700 font-bold text-xs">
                        {q.evento_inicio ? new Date(q.evento_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'PEND'} - {q.evento_fin ? new Date(q.evento_fin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'PEND'}
                      </span>
                      <span className="text-[9px] text-zinc-400  font-black tracking-tighter">{q.evento_inicio ? new Date(q.evento_inicio).getFullYear() : '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">{getStatusBadge(q)}</td>
                  <td className="px-6 py-5 text-right">
                    <span className="font-black text-zinc-900 text-[14px] tracking-tight">
                      $ {(q.vlrTotal || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user?.role === 'ADMIN' && (
                        <button
                          title={activeTab === 'active' ? 'Archivar cotización' : 'Desarchivar cotización'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeTab === 'active') setQToArchive(q);
                            else handleUnarchive(q.id);
                          }}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${activeTab === 'active' ? 'text-zinc-400 hover:text-amber-600 hover:bg-amber-50' : 'text-zinc-400 hover:text-primary hover:bg-blue-50'}`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {activeTab === 'active' ? 'inventory_2' : 'unarchive'}
                          </span>
                        </button>
                      )}
                      <span className="material-symbols-outlined text-zinc-300 text-[20px]">chevron_right</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Admin Status Popover */}
      {activePopover && (
        <div
          className="fixed inset-0 z-[100]"
          onClick={() => setActivePopover(null)}
        >
          <div
            className="absolute bg-white border border-zinc-200 rounded-lg shadow-2xl p-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-150"
            style={{
              top: activePopover.rect.bottom + 8,
              left: activePopover.rect.left,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <p className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50 mb-1">
              Cambiar Estado
            </p>
            {[
              { val: 'BORRADOR', label: 'BORRADOR' },
              { val: 'ENVIADA', label: 'ENVIADA' },
              { val: 'APROBADA', label: 'APROBADA' },
              { val: 'REVISION_SOLICITADA', label: 'CAMBIOS SOLICITADOS' },
              { val: 'ACCEPTED_PENDING_OC', label: 'PENDIENTE OC' },
              { val: 'FINALIZADA', label: 'LEGALIZADA' },
              { val: 'CANCELADA', label: 'CANCELADA' }
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => handleInPlaceStatusChange(activePopover.id, opt.val)}
                className={`w-full text-left px-3 py-2.5 text-[11px] font-bold rounded-md transition-all hover:bg-zinc-50 ${activePopover.currentStatus === opt.val ? 'text-primary bg-primary/5' : 'text-zinc-600'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationList;
