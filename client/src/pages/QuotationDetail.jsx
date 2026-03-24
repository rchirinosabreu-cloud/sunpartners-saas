import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { generateQuotationPDF } from '../utils/pdfGenerator';
import Modal from '../components/ui/Modal';

const QuotationDetail = () => {
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
          <p className="text-red-600 font-bold uppercase text-[10px]">Stock insuficiente para aprobación</p>
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

  if (loading) return <div className="p-8 font-body text-zinc-500 text-center mt-20 italic animate-pulse">Sincronizando con el motor de negocio...</div>;
  if (!quotation) return <div className="p-8 font-body text-red-500 text-center">Cotización no encontrada.</div>;

  const subtotalItems = (quotation.items || []).reduce((acc, item) => acc + (item.cantidad * item.precio_pactado), 0);
  const subtotalServices = (quotation.services || []).reduce((acc, svc) => acc + (svc.cantidad * svc.precio_pactado), 0);
  const subtotal = subtotalItems + subtotalServices;
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  const tabs = [
    { id: 'cotizador', label: 'Cotizador', icon: 'receipt_long' },
    { id: 'fechas', label: 'Logística Fechas', icon: 'calendar_today' },
    { id: 'bitacora', label: 'Bitácora Interna', icon: 'notes' },
    { id: 'historial', label: 'Historial', icon: 'history' },
  ];

  const formatDate = (date) => date ? new Date(date).toLocaleString() : 'N/A';

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

      {/* Detail Header */}
      <div className="bg-white border-b border-zinc-200 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cotizaciones')}
              className="size-9 flex items-center justify-center rounded border border-zinc-200 text-zinc-400 hover:text-zinc-900 transition-colors bg-white"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900 uppercase">{quotation.nombre_evento}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                  quotation.estado === 'APROBADA' ? 'bg-green-50 border-green-200 text-green-700' :
                  quotation.estado === 'ENVIADA' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                  quotation.estado === 'REVISION_SOLICITADA' ? 'bg-brand-alert/10 border-brand-alert/30 text-brand-alert' :
                  'bg-zinc-100 border-zinc-200 text-zinc-500'
                }`}>
                  {quotation.estado}
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-body uppercase tracking-wider font-bold">{quotation.client.empresa} • NIT: {quotation.client.nit}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button
                onClick={() => generateQuotationPDF(quotation)}
                className="flex items-center gap-2 border border-zinc-200 px-4 py-2 rounded text-xs font-bold uppercase text-zinc-600 hover:bg-zinc-50 transition-all bg-white"
             >
               <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
               PDF Interno
             </button>

             {!linkData ? (
               <button
                onClick={handleGenerateLink}
                disabled={updating}
                className="bg-zinc-900 text-white px-5 py-2 rounded text-xs font-bold uppercase tracking-wide hover:bg-zinc-800 transition-all flex items-center gap-2"
               >
                 <span className="material-symbols-outlined text-[18px]">send</span>
                 Enviar y Generar Link
               </button>
             ) : (
               <div className="flex items-center gap-2">
                  <div className="px-3 py-2 bg-blue-50 border border-blue-100 rounded text-[10px] font-bold text-blue-700 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">link</span>
                    PORTAL ACTIVO
                  </div>
                  <button
                    onClick={() => window.open(linkData.url, '_blank')}
                    className="bg-primary text-white px-4 py-2 rounded text-xs font-bold uppercase hover:opacity-90"
                  >
                    Ver Portal
                  </button>
               </div>
             )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
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
              {quotation.rejectionType && (
                <div className="bg-brand-alert/10 border-2 border-brand-alert border-dashed p-6 rounded">
                  <div className="flex items-center gap-3 text-brand-alert mb-2">
                    <span className="material-symbols-outlined font-black">warning</span>
                    <h4 className="font-bold uppercase text-sm tracking-wider">Ajustes Solicitados por el Cliente</h4>
                  </div>
                  <p className="text-sm font-bold text-zinc-900 mb-1">Motivo: {quotation.rejectionType}</p>
                  <p className="text-sm text-zinc-600 italic">"{quotation.rejectionReason}"</p>
                </div>
              )}

              <div className="bg-white border border-zinc-200 rounded p-8 shadow-sm">
                <h3 className="font-display text-lg font-bold text-zinc-900 mb-8 flex items-center gap-2 uppercase tracking-widest border-b border-zinc-100 pb-4">
                  <span className="material-symbols-outlined text-primary text-[22px]">inventory_2</span>
                  Equipos Solicitados
                </h3>
                <div className="space-y-6">
                  {quotation.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900 text-sm">{item.inventory.nombre}</span>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.clase_asignada === 'A' ? 'bg-primary/10 text-primary' : 'bg-brand-alert/10 text-brand-alert'}`}>Clase {item.clase_asignada}</span>
                          <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-tighter">Cantidad: {item.cantidad}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-black text-zinc-900">$ {(item.precio_pactado * item.cantidad).toLocaleString()}</span>
                        <span className="text-[10px] text-zinc-400 font-bold">$ {item.precio_pactado.toLocaleString()} /u</span>
                      </div>
                    </div>
                  ))}
                </div>

                {quotation.services && quotation.services.length > 0 && (
                  <>
                    <h3 className="font-display text-lg font-bold text-zinc-900 mt-12 mb-8 flex items-center gap-2 uppercase tracking-widest border-b border-zinc-100 pb-4">
                      <span className="material-symbols-outlined text-zinc-400 text-[22px]">engineering</span>
                      Servicios y Logística
                    </h3>
                    <div className="space-y-6">
                      {quotation.services.map((svc, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-50 last:border-0">
                          <div>
                            <span className="text-[10px] font-black uppercase text-zinc-400 block mb-0.5">{svc.tipo}</span>
                            <span className="font-bold text-zinc-900 text-sm">{svc.descripcion}</span>
                          </div>
                          <div className="text-right font-black text-zinc-900 text-sm">
                            $ {(svc.precio_pactado * svc.cantidad).toLocaleString()}
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
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">Estructura de Costos</h3>
                <div className="space-y-5">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                    <span className="text-zinc-500">Subtotal Neto</span>
                    <span className="text-zinc-200">$ {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                    <span className="text-zinc-500">IVA (19%)</span>
                    <span className="text-zinc-200">$ {iva.toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-zinc-800 my-4"></div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black uppercase text-primary tracking-widest">Total General</span>
                    <span className="text-3xl font-black tracking-tighter text-white">$ {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded p-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                   <span className="material-symbols-outlined text-[18px]">location_on</span>
                   Detalles del Evento
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-black text-zinc-400 block">Lugar</span>
                    <span className="text-sm font-bold text-zinc-900">{quotation.ubicacion}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-zinc-400 block">Contacto Cliente</span>
                    <span className="text-sm font-bold text-zinc-900">{quotation.client.contactoPrincipal}</span>
                    <span className="text-xs text-zinc-500 block">{quotation.client.cargo}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fechas' && (
           <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'MONTAJE', start: quotation.fecha_montaje_inicio, end: quotation.fecha_montaje_fin, icon: 'build' },
                { label: 'EVENTO', start: quotation.fecha_inicio, end: quotation.fecha_fin, icon: 'celebration' },
                { label: 'DESMONTAJE', start: quotation.fecha_desmontaje_inicio, end: quotation.fecha_desmontaje_fin, icon: 'restart_alt' }
              ].map((f, i) => (
                <div key={i} className="bg-white border border-zinc-200 rounded p-6">
                   <div className="flex items-center gap-2 mb-6 border-b border-zinc-50 pb-4">
                      <span className="material-symbols-outlined text-zinc-400">{f.icon}</span>
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900">{f.label}</h4>
                   </div>
                   <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase block">Inicio</span>
                        <span className="text-sm font-bold text-zinc-700">{formatDate(f.start)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-zinc-400 uppercase block">Finalización</span>
                        <span className="text-sm font-bold text-zinc-700">{formatDate(f.end)}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'bitacora' && (
          <div className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded p-8">
             <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6">Notas de Operación</h3>
             <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium">
               {quotation.bitacora || "No hay notas internas registradas para este evento."}
             </p>
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="font-display text-lg font-bold text-zinc-900 uppercase tracking-widest mb-8 text-center">Línea de Tiempo del Evento</h3>
            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-100">
              {(quotation.logs || []).map((log, idx) => (
                <div key={idx} className="relative pl-10">
                  <div className="absolute left-0 top-1.5 size-6 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-primary"></div>
                  </div>
                  <div className="bg-white border border-zinc-100 p-5 rounded shadow-sm">
                    <div className="flex justify-between mb-3 border-b border-zinc-50 pb-2">
                      <span className="text-[10px] text-zinc-400 font-black uppercase tracking-tighter">{new Date(log.createdAt).toLocaleString()}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase">
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
