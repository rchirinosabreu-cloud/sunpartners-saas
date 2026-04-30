import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import { calculateLineTotal, calculateTotals } from '../utils/quotationUtils';
import Modal from '../components/ui/Modal';

const QuotationDetail = () => {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cotizador');
  const [updating, setUpdating] = useState(false);
  const [linkData, setLinkData] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    try {
      const res = await axios.get(`/api/quotations/${id}`, { withCredentials: true });
      setQuotation(res.data);
      if (res.data.secureHash) {
        setLinkData({ hash: res.data.secureHash, url: `${window.location.origin}/q/${res.data.secureHash}` });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await axios.put(`/api/quotations/${id}/status`, { estado: newStatus }, { withCredentials: true });
      setModal({ isOpen: true, title: 'Estado Actualizado', content: `La cotización ahora está en estado: ${newStatus}`, type: 'success' });
      await fetchQuotation();
    } catch (err) {
      const errorMsg = err.response?.data?.details || err.response?.data?.error || 'No se pudo cambiar el estado.';
      setModal({
        isOpen: true,
        title: 'Conflicto detectado',
        content: <div className="space-y-2">
          <p className="text-red-600 font-bold  text-[10px]">Stock insuficiente para aprobación</p>
          <p className="text-zinc-800">{errorMsg}</p>
        </div>,
        type: 'error'
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateLink = async () => {
    setUpdating(true);
    try {
      const res = await axios.post(`/api/quotations/${id}/secure-link`, {}, { withCredentials: true });
      setLinkData({ hash: res.data.hash, url: `${window.location.origin}${res.data.url}` });
      setModal({ isOpen: true, title: 'Portal Activado', content: 'Se ha generado el link seguro para el cliente.', type: 'success' });
      await fetchQuotation();
    } catch (err) {
      setModal({ isOpen: true, title: 'Error', content: 'No se pudo generar el link seguro.', type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 font-body text-zinc-500 text-center mt-20 animate-pulse">Sincronizando propuesta...</div>;
  if (!quotation) return <div className="p-8 font-body text-red-500 text-center">Cotización no encontrada.</div>;

  const { subtotal, iva, total } = calculateTotals(quotation.items, quotation.services, quotation.client.isTaxExempt);

  const tabs = [
    { id: 'cotizador', label: 'Cotizador', icon: 'receipt_long' },
    { id: 'fechas', label: 'Logística Fechas', icon: 'calendar_today' },
    { id: 'bitacora', label: 'Bitácora Interna', icon: 'notes' },
    { id: 'historial', label: 'Historial', icon: 'history' },
  ];

  const formatHierarchyDate = (dateString) => {
    if (!dateString) return 'PENDIENTE';
    const date = new Date(dateString);
    const datePart = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(date);
    const timePart = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);

    return (
      <div className="flex flex-col">
        <span className="text-zinc-400 text-[10px] font-bold  tracking-tight">{datePart}</span>
        <span className="text-zinc-900 text-sm font-black ">{timePart}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] font-body">
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        type={modal.type}
      >
        {modal.content}
      </Modal>

      {/* Detail Header (v20.0: Absolute Normalization) */}
      <div className="bg-white border-b border-zinc-100 px-12 py-10 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-10">
            <button
              onClick={() => navigate('/cotizaciones')}
              className="size-10 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 transition-all bg-white"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>

            <div className="flex items-start gap-10">
              <img src="/logo_sp.png" alt="Sunpartners" className="h-16 w-auto" />
              <div className="h-14 w-px bg-zinc-100"></div>
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <h2 className="font-display text-2xl font-black tracking-tighter text-zinc-900 leading-none">{quotation.nombre_evento}</h2>
                  <div className="flex flex-col gap-1">
                     <p className="text-[12px] text-zinc-500 font-medium tracking-tight">
                        {quotation.client.razon_social} • {quotation.client.documentType || 'NIT'}: {quotation.client.nit_id}
                     </p>
                     <p className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                        {quotation.ubicacion || 'Lugar por definir'}
                     </p>
                  </div>
                </div>

                {/* Status Badges Group (LEFT SIDE) */}
                <div className="flex items-center gap-2 pt-1">
                  <span className={`badge-status ${
                    quotation.estado === 'APROBADA' ? 'bg-green-50 border-green-200 text-green-700' :
                    quotation.estado === 'ENVIADA' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                    quotation.estado === 'REVISION_SOLICITADA' ? 'bg-brand-alert/10 border-brand-alert/30 text-brand-alert' :
                    'bg-zinc-50 border-zinc-200 text-zinc-500'
                  }`}>
                    {quotation.estado.replace('_', ' ')}
                  </span>
                  {quotation.client.isTaxExempt && (
                    <span className="badge-status bg-zinc-50 text-zinc-500 border-zinc-200">
                      EXENTO
                    </span>
                  )}
                  {quotation.archivedAt && (
                    <span className="badge-status bg-amber-50 text-amber-700 border-amber-200">
                      ARCHIVADA
                    </span>
                  )}
                  {linkData && (
                    <div className="badge-status bg-blue-50 border-blue-100 text-blue-700">
                      PORTAL ACTIVO
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Unified Action Buttons (RIGHT SIDE) */}
          <div className="flex items-center gap-3">
             <button
                onClick={() => generateQuotationPDF(quotation)}
                className="btn-action border border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50"
             >
               <span className="material-symbols-outlined">picture_as_pdf</span>
               PDF INTERNO
             </button>

             {quotation.purchaseOrderUrl && (
               <button
                onClick={() => window.open(quotation.purchaseOrderUrl, '_blank')}
                className="btn-action border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
               >
                 <span className="material-symbols-outlined">attachment</span>
                 VER ORDEN
               </button>
             )}

             {(!linkData || quotation.estado === 'REVISION_SOLICITADA') ? (
               <button
                onClick={handleGenerateLink}
                disabled={updating}
                className="btn-action bg-zinc-900 text-white hover:bg-zinc-800"
               >
                 <span className="material-symbols-outlined">send</span>
                 {quotation.estado === 'REVISION_SOLICITADA' ? 'REENVIAR AJUSTES' : 'ENVIAR PORTAL'}
               </button>
             ) : (
               <button
                onClick={() => window.open(linkData.url, '_blank')}
                className="btn-action bg-primary text-white hover:opacity-90"
               >
                 <span className="material-symbols-outlined">open_in_new</span>
                 VER PORTAL
               </button>
             )}

             {(quotation.estado === 'BORRADOR' || quotation.estado === 'REVISION_SOLICITADA') && (
               <button
                disabled={!!quotation.archivedAt || (currentUser?.role === 'CONSULTOR' && quotation.consultantId !== currentUser?.id)}
                onClick={() => navigate(`/cotizaciones/editar/${id}`)}
                className={`btn-action bg-primary text-white hover:opacity-90 ${(quotation.archivedAt || (currentUser?.role === 'CONSULTOR' && quotation.consultantId !== currentUser?.id)) ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 <span className="material-symbols-outlined">edit</span>
                 EDITAR
               </button>
             )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-xs font-bold  tracking-widest transition-all border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
            >
              <span className={`material-symbols-outlined text-[18px]`}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-8 font-body">
        {activeTab === 'cotizador' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="lg:col-span-2 space-y-8">
              {quotation.estado === 'REVISION_SOLICITADA' && quotation.rejectionType && (
                <div className="bg-brand-alert/10 border-2 border-brand-alert border-dashed p-6 rounded">
                  <div className="flex items-center gap-3 text-brand-alert mb-2">
                    <span className="material-symbols-outlined font-black">warning</span>
                    <h4 className="font-bold  text-sm tracking-wider">Ajustes Solicitados por el Cliente</h4>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 mb-1">Motivo: {quotation.rejectionType}</p>
                  <p className="text-sm text-zinc-600">"{quotation.rejectionReason}"</p>
                </div>
              )}

              <div className="bg-white border border-zinc-200 rounded p-8 shadow-sm">
                <h3 className="font-display text-lg font-bold text-zinc-900 mb-8 flex items-center gap-2  tracking-widest border-b border-zinc-100 pb-4">
                  <span className="material-symbols-outlined text-primary text-[22px]">inventory_2</span>
                  Equipos Solicitados
                </h3>
                <div className="space-y-6">
                  {quotation.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-4 border-b border-zinc-50 last:border-0">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900 text-sm ">{item.customName || item.inventory?.nombre_comercial || 'Ítem no identificado'}</span>
                        <span className="text-[10px] text-zinc-400 font-bold  mt-0.5">({item.cantidad} UNIDADES X {item.dias} DÍAS)</span>
                        {/* Composition breakdown (v18.0: Clean) */}
                        {(item.compositions?.length > 0 || item.inventory?.compositions?.length > 0) && (
                          <span className="text-[10px] text-zinc-500 font-medium italic mt-1 max-w-md">
                            (Incluye: {(item.compositions || item.inventory.compositions).map(c => `${c.quantity} ${c.warehouseItem?.nombre || c.nombre || 'Ítem'}`).join(', ')})
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-black text-zinc-900">$ {calculateLineTotal(item).toLocaleString()}</span>
                        <div className="flex flex-col text-[9px] text-zinc-400 font-bold mt-0.5">
                          <span>VR. 1ER DÍA: $ {item.precio_pactado.toLocaleString()}</span>
                          {item.dias > 1 && <span>VR. ADIC: $ {item.precio_dia_adicional.toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {quotation.services && quotation.services.length > 0 && (
                  <>
                    <h3 className="font-display text-lg font-bold text-zinc-900 mt-12 mb-8 flex items-center gap-2  tracking-widest border-b border-zinc-100 pb-4">
                      <span className="material-symbols-outlined text-zinc-400 text-[22px]">engineering</span>
                      Servicios y Logística
                    </h3>
                    <div className="space-y-6">
                      {quotation.services.map((svc, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                          <div>
                            <span className="text-[10px] font-black  text-zinc-400 block mb-0.5">{svc.tipo}</span>
                            <span className="font-bold text-zinc-900 text-sm ">{svc.descripcion}</span>
                            <span className="text-[10px] text-zinc-400 font-bold  block mt-0.5">({svc.cantidad} UNIDADES X {svc.dias} DÍAS)</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-sm font-black text-zinc-900">$ {calculateLineTotal(svc).toLocaleString()}</span>
                            <div className="flex flex-col text-[9px] text-zinc-400 font-bold mt-0.5">
                              <span>VR. 1ER DÍA: $ {svc.precio_pactado.toLocaleString()}</span>
                              {svc.dias > 1 && <span>VR. ADIC: $ {svc.precio_dia_adicional.toLocaleString()}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-zinc-900 text-zinc-50 rounded p-8 shadow-lg border border-zinc-800">
                <h3 className="text-[10px] font-black  tracking-[0.3em] text-zinc-500 mb-8">Estructura de Costos</h3>
                <div className="space-y-5">
                  <div className="flex justify-between items-center text-xs font-bold  tracking-wider">
                    <span className="text-zinc-500">Subtotal Neto</span>
                    <span className="text-zinc-200">$ {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold  tracking-wider">
                    <span className="text-zinc-500">{quotation.client.isTaxExempt ? 'IVA (0% - Exento)' : 'IVA (19%)'}</span>
                    <span className="text-zinc-200">$ {iva.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-zinc-800 my-4"></div>
                  <div className="flex justify-between items-end pt-4">
                    <span className="text-[10px] font-black  text-primary tracking-[0.4em]">TOTAL</span>
                    <span className="text-2xl font-black tracking-tighter text-white ml-10">$ {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded p-6">
                <h3 className="text-xs font-black  tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                   <span className="material-symbols-outlined text-[18px]">location_on</span>
                   Detalles del Evento
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px]  font-black text-zinc-400 block">Lugar</span>
                    <span className="text-sm font-bold text-zinc-900">{quotation.ubicacion}</span>
                  </div>
                  <div>
                    <span className="text-[10px]  font-black text-zinc-400 block">Contacto Cliente</span>
                    <span className="text-sm font-bold text-zinc-900">{quotation.client.responsable}</span>
                    <span className="text-xs text-zinc-500 block">{quotation.client.ciudad}</span>
                  </div>
                  <div>
                    <span className="text-[10px]  font-black text-zinc-400 block">Consultor Responsable</span>
                    <div className="flex items-center gap-2 mt-1">
                       <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 ">
                          {quotation.consultant?.nombre?.substring(0,2) || 'S'}
                       </div>
                       <span className="text-sm font-bold text-zinc-900 ">{quotation.consultant?.nombre || 'SISTEMA'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px]  font-black text-zinc-400 block">Fecha Principal</span>
                    <span className="text-sm font-bold text-zinc-900">{new Date(quotation.evento_inicio).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fechas' && (
           <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'MONTAJE', start: quotation.montaje_inicio, end: quotation.montaje_fin, icon: 'build' },
                { label: 'EVENTO', start: quotation.evento_inicio, end: quotation.evento_fin, icon: 'celebration' },
                { label: 'DESMONTAJE', start: quotation.desmontaje_inicio, end: quotation.desmontaje_fin, icon: 'restart_alt' }
              ].map((f, i) => (
                <div key={i} className="bg-white border border-zinc-200 rounded p-6 shadow-sm">
                   <div className="flex items-center gap-2 mb-6 border-b border-zinc-50 pb-4">
                      <span className="material-symbols-outlined text-zinc-400">{f.icon}</span>
                      <h4 className="text-xs font-black  tracking-widest text-zinc-900">{f.label}</h4>
                   </div>
                   <div className="space-y-6">
                      <div>
                        <span className="text-[8px] font-black text-zinc-400  block mb-1 tracking-widest">Inicio Despliegue</span>
                        {formatHierarchyDate(f.start)}
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-zinc-400  block mb-1 tracking-widest">Cierre Fase</span>
                        {formatHierarchyDate(f.end)}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'bitacora' && (
          <div className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded p-8">
             <h3 className="text-xs font-black  tracking-widest text-zinc-400 mb-6">Notas de Operación</h3>
             <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium">
               {quotation.bitacora || "No hay notas internas registradas para este evento."}
             </p>
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="font-display text-lg font-bold text-zinc-900  tracking-widest mb-8 text-center">Línea de Tiempo del Evento</h3>
            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-100">
              {(quotation.logs || []).map((log, idx) => (
                <div key={idx} className="relative pl-10">
                  <div className="absolute left-0 top-1.5 size-6 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-primary"></div>
                  </div>
                  <div className="bg-white border border-zinc-100 p-5 rounded shadow-sm">
                    <div className="flex justify-between mb-3 border-b border-zinc-50 pb-2">
                      <span className="text-[10px] text-zinc-400 font-black  tracking-tighter">{new Date(log.createdAt).toLocaleString()}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold ">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        {log.user?.nombre || "SISTEMA PORTAL"}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-700 font-bold leading-relaxed">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationDetail;
