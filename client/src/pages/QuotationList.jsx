import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useRole,
  useClick,
  useInteractions,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import { toTitleCase, matchesSearch } from '../utils/formatters';
import SharedUserAvatar from '../components/SharedUserAvatar';

const QuotationList = () => {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [activePopover, setActivePopover] = useState(null); // { id: string, currentStatus: string }

  const { refs, floatingStyles, context } = useFloating({
    open: !!activePopover,
    onOpenChange: (isOpen) => !isOpen && setActivePopover(null),
    middleware: [
      offset(8),
      flip({ fallbackAxisSideDirection: 'end' }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);
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

  const handleInPlaceStatusChange = async (quotationId, newStatus, force = false) => {
    try {
      await axios.put(`/api/quotations/${quotationId}/status`, {
        estado: newStatus,
        details: 'Estado cambiado manualmente por Administrador',
        force: force
      }, { withCredentials: true });

      setActivePopover(null);
      fetchQuotations();
    } catch (err) {
      // v47.0: Handle availability conflict with bypass option
      if (err.response?.status === 400 && err.response?.data?.error === 'Conflicto de disponibilidad') {
        setActivePopover(null);
        setMessageModal({
          isOpen: true,
          title: 'Conflicto de disponibilidad',
          content: (
            <div className="space-y-4">
              <p className="text-zinc-600 text-xs font-medium leading-relaxed">{err.response.data.details}</p>
              <div className="h-px bg-zinc-100 w-full" />
              <p className="text-zinc-900 font-black text-[11px] tracking-tight">¿Deseas aprobar la propuesta de todas formas?</p>
            </div>
          ),
          type: 'warning',
          action: {
            label: 'Sí, aprobar con conflicto',
            onClick: () => {
              setMessageModal({ ...messageModal, isOpen: false });
              handleInPlaceStatusChange(quotationId, newStatus, true);
            },
            color: 'primary'
          }
        });
        return;
      }

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
      CANCELADA: { style: 'bg-red-50 text-red-600', label: 'CANCELADA' },
      RECHAZADA: { style: 'bg-red-100 text-red-700', label: 'RECHAZADA' },
      REVISION_SOLICITADA: { style: 'bg-red-50 text-red-600', label: 'CAMBIOS SOLICITADOS' },
      ACCEPTED_PENDING_OC: { style: 'bg-amber-50 text-amber-600', label: 'PENDIENTE OC' }
    };
    const config = styles[status] || { style: 'bg-zinc-100 text-zinc-600', label: status };

    const isActive = activePopover?.id === quotation.id;

    const hasStatusEditPermission = user?.role === 'ADMIN' || user?.id === quotation.consultantId;

    return (
      <span
        ref={isActive ? refs.setReference : null}
        {...(isActive ? getReferenceProps() : {})}
        onClick={(e) => {
          if (hasStatusEditPermission) {
            e.stopPropagation();
            setActivePopover({ id: quotation.id, currentStatus: status });
          }
        }}
        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${config.style} ${hasStatusEditPermission ? 'cursor-pointer hover:ring-2 ring-primary/20 transition-all' : ''}`}
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
        action={messageModal.action}
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
                       <SharedUserAvatar
                         user={q.consultant}
                         size={28}
                         title={toTitleCase(q.consultant?.nombre) || 'Sistema'}
                       />
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
      {/* Admin Status Popover (v47.0: Smart Positioning with Floating UI) */}
      {activePopover && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={-1}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-[200] bg-white border border-zinc-200 rounded-lg shadow-2xl p-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-150 outline-none"
              onClick={e => e.stopPropagation()}
            >
              <p className="px-3 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-50 mb-1">
                Cambiar Estado
              </p>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {[
                  { val: 'BORRADOR', label: 'BORRADOR' },
                  { val: 'ENVIADA', label: 'ENVIADA' },
                  { val: 'APROBADA', label: 'APROBADA' },
                  { val: 'REVISION_SOLICITADA', label: 'CAMBIOS SOLICITADOS' },
                  { val: 'ACCEPTED_PENDING_OC', label: 'PENDIENTE OC' },
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
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </div>
  );
};

export default QuotationList;
