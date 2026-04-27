import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { calculateLineTotal, calculateTotals } from '../utils/quotationUtils';
import Modal from '../components/ui/Modal';

const PublicQuotation = () => {
  const { hash } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [ocFile, setOcFile] = useState(null);
  const [rejection, setRejection] = useState({ type: 'CANTIDADES', reason: '' });
  const [processing, setProcessing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [uiModal, setUiModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await axios.get(`/api/quotations/public/${hash}`, { timeout: 10000 });
        setQuotation(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo cargar la propuesta digital. Verifica tu conexión.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [hash]);

  const handleApprove = async () => {
    setShowApproveModal(false);
    setShowUploadModal(true);
  };

  const handleFormalize = async () => {
    if (!ocFile) {
      setUiModal({ isOpen: true, title: 'Atención', content: 'Por favor, selecciona el archivo de tu Orden de Compra.', type: 'warning' });
      return;
    }

    setProcessing(true);
    const formData = new FormData();
    formData.append('purchaseOrder', ocFile);

    try {
      await axios.post(`/api/quotations/public/${hash}/formalize`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 20000
      });
      setFinished(true);
      setShowUploadModal(false);
    } catch (err) {
      setUiModal({
        isOpen: true,
        title: 'Error de Carga',
        content: err.response?.data?.error || 'No se pudo cargar la Orden de Compra. Inténtalo de nuevo.',
        type: 'error'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejection.reason && rejection.type === 'OTRO') {
      setUiModal({ isOpen: true, title: 'Atención', content: 'Por favor, especifica el motivo del ajuste.', type: 'warning' });
      return;
    }
    setProcessing(true);
    try {
      await axios.post(`/api/quotations/public/${hash}/reject`, {
        rejectionType: rejection.type,
        rejectionReason: rejection.reason
      }, { timeout: 10000 });
      setFinished(true);
      setShowRejectModal(false);
    } catch (err) {
      setUiModal({ isOpen: true, title: 'Error', content: 'Error al enviar la solicitud de revisión.', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !quotation) return <div className="min-h-screen bg-white flex flex-col items-center justify-center font-body text-zinc-400">
    <div className="size-12 border-2 border-primary/10 border-t-primary rounded-full animate-spin mb-4"></div>
    <span className="text-[10px] font-black  tracking-[0.3em]">Sincronizando Propuesta Digital...</span>
  </div>;

  if (error) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-8 font-body">
      <div className="bg-white border border-red-100 p-12 rounded-lg text-center shadow-2xl">
        <span className="material-symbols-outlined text-red-500 text-5xl mb-6">cloud_off</span>
        <h2 className="text-xl font-black  text-zinc-900 mb-2">Error de Conexión</h2>
        <p className="text-zinc-500 font-bold  text-[10px] tracking-[0.2em]">{error}</p>
      </div>
    </div>
  );

  if (finished) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-body p-8 text-center">
         <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 shadow-xl">
            <span className="material-symbols-outlined text-primary text-[48px] font-black">check_circle</span>
         </div>
         <h2 className="text-zinc-900 text-4xl font-black  tracking-tighter mb-4">Gestión Finalizada</h2>
         <p className="text-zinc-400 max-w-md mx-auto font-bold  text-[11px] tracking-widest leading-relaxed">Su respuesta ha sido procesada por nuestro motor de negocio. Un ejecutivo de Sunpartners se pondrá en contacto con usted en breve.</p>
         <div className="mt-20 text-[9px] font-black text-zinc-200  tracking-[0.6em]">Sunpartners Premium System • Excellence as Standard</div>
      </div>
    );
  }

  const { subtotal, iva, total } = calculateTotals(quotation?.items, quotation?.services, quotation?.client?.isTaxExempt);

  const formatPublicDate = (dateString) => {
    if (!dateString) return 'PENDIENTE';
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(new Date(dateString));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-body py-12 px-4 md:px-8 lg:px-12">
      <Modal isOpen={uiModal.isOpen} onClose={() => setUiModal({ ...uiModal, isOpen: false })} title={uiModal.title} type={uiModal.type}>
        {uiModal.content}
      </Modal>

      <div className="max-w-6xl mx-auto bg-white border border-zinc-200 rounded-lg shadow-2xl overflow-hidden relative">
        {/* Aesthetic Stripe */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary shadow-[0_2px_10px_rgba(84,134,161,0.3)]"></div>

        {/* Public Header - Institutional Symmetry (v26.0: Seamless Transition) */}
        <div className="p-12 md:p-20 pb-0 md:pb-0 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
           <div>
              <div className="flex items-center gap-6 mb-12">
                 <img src="/logo_sp.png" alt="Sunpartners" className="w-[300px] h-auto object-contain" />
              </div>
              <div className="space-y-3 pt-6 border-t border-zinc-50 max-w-xs">
                 <h2 className="text-2xl font-black tracking-tighter text-zinc-900 leading-none">COTIZACIÓN</h2>
                 <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black text-zinc-400 tracking-widest uppercase">REF: #Q-{(quotation?.id || 'REF').substring(0,6).toUpperCase()}</span>
                    <span className="text-[10px] font-medium text-zinc-300">EMISIÓN: {new Date().toLocaleDateString('es-CO')}</span>
                 </div>
              </div>
           </div>
           <div className="flex flex-col items-start md:items-end gap-2 text-left md:text-right">
              <p className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">SUN PARTNERS GLOBAL LOGISTIC S.A.S. | NIT: 901480536-2</p>
              <p className="text-[10px] font-medium text-zinc-400">Cra. 15 No. 15-25, local 2, Cartagena de Indias.</p>
              <p className="text-[10px] font-medium text-zinc-400">Cel: +57 301 400 4743 | sunpartnersco@gmail.com</p>
              <p className="text-[10px] font-medium text-zinc-400">@sunpartners | www.sunpartners.com.co</p>
           </div>
        </div>
           <div className="p-12 md:p-20 pt-10 md:pt-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
              <div className="text-left space-y-4">
                 <span className="text-[9px] font-black text-zinc-400  tracking-widest block border-b border-zinc-100 pb-2 uppercase">Cliente</span>
                 <p className="text-xl font-black text-zinc-900  tracking-tight">{quotation.client.razon_social}</p>
                 <div className="text-[10px] font-bold text-zinc-500 space-y-1">
                    <p>{quotation.client.documentType || 'NIT'}: {quotation.client.nit_id || 'PENDIENTE'}</p>
                    <p className="flex items-center gap-1">
                       <span className="material-symbols-outlined text-[14px]">location_on</span>
                       {quotation.ubicacion || 'Lugar por definir'}
                    </p>
                 </div>
              </div>
              <div className="text-left md:text-right">
                 <span className="text-[9px] font-black text-zinc-400 tracking-widest block border-b border-zinc-100 pb-2 mb-6 uppercase">DATOS DEL EVENTO</span>
                 <div className="space-y-6">
                    <div>
                       <p className="text-[9px] font-black text-zinc-300 mb-0.5 tracking-wider">Nombre del evento</p>
                       <p className="text-[13px] font-black text-zinc-900 leading-tight">{quotation.nombre_evento}</p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-zinc-300 mb-0.5 tracking-wider">Lugar evento</p>
                       <p className="text-[12px] font-black text-primary leading-tight">{quotation.ubicacion || 'POR DEFINIR'}</p>
                    </div>
                    {/* v26.0: Horizontal Date Grid (Flexbox) */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-10 lg:gap-14 pt-6 border-t border-zinc-50">
                       <div className="text-left md:text-right">
                          <p className="text-[9px] font-black text-zinc-300 tracking-widest uppercase mb-1">Montaje</p>
                          <p className="text-[10px] font-black text-zinc-800 whitespace-nowrap">{formatPublicDate(quotation.montaje_inicio)}</p>
                       </div>
                       <div className="text-left md:text-right">
                          <p className="text-[9px] font-black text-primary tracking-widest uppercase mb-1">Inicio Evento</p>
                          <p className="text-[10px] font-black text-zinc-800 whitespace-nowrap">{formatPublicDate(quotation.evento_inicio)}</p>
                       </div>
                       <div className="text-left md:text-right">
                          <p className="text-[9px] font-black text-zinc-300 tracking-widest uppercase mb-1">Fin Desmontaje</p>
                          <p className="text-[10px] font-black text-zinc-800 whitespace-nowrap">{formatPublicDate(quotation.desmontaje_fin)}</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

        {/* Breakdown Table */}
        <div className="px-12 md:px-20 py-16">
           <h3 className="text-[11px] font-black  tracking-[0.4em] text-zinc-400 mb-10 border-l-4 border-primary pl-6">Desglose de Equipamiento y Logística</h3>
           <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-zinc-100">
                  <th className="pb-6 text-[10px] font-black  tracking-widest text-zinc-900 uppercase">Detalles del servicio</th>
                  <th className="pb-6 text-[10px] font-black  tracking-widest text-zinc-900 text-center uppercase">Cant.</th>
                  <th className="pb-6 text-[10px] font-black  tracking-widest text-zinc-900 text-center">Días.</th>
                  <th className="pb-6 text-[10px] font-black  tracking-widest text-zinc-900 text-right">Inversión Un.</th>
                  <th className="pb-6 text-[10px] font-black  tracking-widest text-zinc-900 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(quotation.items || []).map((item, idx) => (
                  <tr key={idx} className="group">
                    <td className="py-8">
                       <p className="font-black text-base text-zinc-900  tracking-tight group-hover:text-primary transition-colors">{item.customName || item.inventory?.nombre_comercial || 'Ítem no identificado'}</p>
                       <span className="text-[10px] font-bold text-zinc-400  mt-0.5">({item.cantidad} UNIDADES X {item.dias} DÍAS)</span>
                       {/* Composition breakdown (v18.0: Clean) */}
                       {(item.compositions?.length > 0 || item.inventory?.compositions?.length > 0) && (
                          <span className="text-[10px] text-zinc-500 font-medium italic mt-1 block max-w-md">
                            (Incluye: {(item.compositions || item.inventory.compositions).map(c => `${c.quantity} ${c.warehouseItem?.nombre || c.nombre || 'Ítem'}`).join(', ')})
                          </span>
                       )}
                    </td>
                    <td className="py-8 text-center font-black text-zinc-600">{item.cantidad}</td>
                    <td className="py-8 text-center font-black text-zinc-600">{item.dias}</td>
                    <td className="py-8 text-right font-bold text-zinc-500 text-[10px] ">
                       <div className="flex flex-col">
                          <span>VR. 1ER DÍA: $ {item.precio_pactado.toLocaleString()}</span>
                          {item.dias > 1 && <span className="text-primary font-black">VR. ADIC: $ {item.precio_dia_adicional.toLocaleString()}</span>}
                       </div>
                    </td>
                    <td className="py-8 text-right font-black text-lg text-zinc-900 tracking-tighter">$ {calculateLineTotal(item).toLocaleString()}</td>
                  </tr>
                ))}
                {(quotation.services || []).map((svc, idx) => (
                  <tr key={idx}>
                    <td className="py-8 border-l-4 border-primary/20 pl-4 bg-primary/5">
                       <p className="font-black text-base text-zinc-900  tracking-tight">{svc.descripcion.replace('Transporte Especializado', 'Transporte').trim()}</p>
                       <span className="text-[10px] font-bold text-zinc-400  mt-0.5">({svc.cantidad} UNIDADES X {svc.dias} DÍAS)</span>
                       <span className="text-[9px] font-black text-primary  tracking-widest mt-1 block">{svc.tipo.replace('Transporte Especializado', 'Transporte').trim()} {svc.tipo.includes('Transporte') ? '' : 'Especializado'}</span>
                    </td>
                    <td className="py-8 text-center font-black text-zinc-600 bg-primary/5">{svc.cantidad}</td>
                    <td className="py-8 text-center font-black text-zinc-600 bg-primary/5">{svc.dias}</td>
                    <td className="py-8 text-right font-bold text-zinc-500 bg-primary/5 text-[10px] ">
                       <div className="flex flex-col">
                          <span>VR. 1ER DÍA: $ {svc.precio_pactado.toLocaleString()}</span>
                          {svc.dias > 1 && <span className="text-primary font-black">VR. ADIC: $ {svc.precio_dia_adicional.toLocaleString()}</span>}
                       </div>
                    </td>
                    <td className="py-8 text-right font-black text-lg text-zinc-900 tracking-tighter bg-primary/5">$ {calculateLineTotal(svc).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        {/* Totals & Legal Block - Sunpartners Premium Style */}
        <div className="bg-zinc-50 p-12 md:p-20 flex flex-col lg:flex-row justify-between gap-16 border-t border-zinc-100">
           <div className="max-w-2xl">
              <h4 className="text-[11px] font-black  tracking-[0.4em] text-primary mb-8 border-b border-zinc-200 pb-4">Términos y Condiciones Legales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {[
                  "La reserva de equipos se confirma únicamente con el pago del 70% del valor total.",
                  "Esta cotización tiene una vigencia de 24 horas a partir de su emisión.",
                  "Precios sujetos a disponibilidad al momento de la formalización del pago.",
                  "El cliente es responsable por cualquier daño, pérdida o robo de los equipos.",
                  "Sunpartners no se hace responsable por fallas eléctricas externas.",
                  "Cancelaciones con menos de 48 horas incurren en penalidad del 50%.",
                  "Los horarios de montaje y desmontaje deben cumplirse estrictamente.",
                  "No se permite el subarriendo ni traslado de equipos sin autorización.",
                  "Personal técnico adicional será facturado según bitácora de obra.",
                  "El saldo restante (30%) debe cancelarse antes del inicio del montaje."
                ].map((text, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-[10px] font-black text-primary leading-none pt-0.5">{i+1}.</span>
                    <p className="text-[10px] leading-relaxed text-zinc-400 font-bold  tracking-tight">{text}</p>
                  </div>
                ))}
              </div>
           </div>
           <div className="min-w-[320px] space-y-6 lg:border-l lg:border-zinc-200 lg:pl-16">
              <div className="flex justify-between items-center text-[10px] font-black  tracking-[0.2em] text-zinc-400">
                <span>Subtotal Neto</span>
                <span className="text-zinc-900">$ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black  tracking-[0.2em] text-zinc-400">
                <span>{quotation.client.isTaxExempt ? 'IVA (0% - Exento)' : 'IVA Causado (19%)'}</span>
                <span className="text-zinc-900">$ {iva.toLocaleString()}</span>
              </div>
              <div className="pt-8 border-t border-zinc-200 flex justify-between items-end">
                <span className="text-[11px] font-black  tracking-[0.4em] text-primary">TOTAL</span>
                <div className="flex items-baseline gap-2">
                   <span className="text-4xl font-black tracking-tighter text-zinc-900">$ {total.toLocaleString()}</span>
                </div>
              </div>
           </div>
        </div>

        {/* Actions */}
        <div className="p-16 flex flex-col md:flex-row justify-center items-center gap-10 bg-white border-t border-zinc-100">
           <button
            onClick={() => setShowApproveModal(true)}
            className="w-full md:w-auto bg-[#fbae17] text-white px-20 py-5 rounded-lg text-[11px] font-black  tracking-[0.4em] hover:bg-[#e5a015] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-4 border-b-4 border-black/5"
           >
             <span className="material-symbols-outlined text-[20px] fill">verified</span>
             Confirmar Propuesta
           </button>
           <button
            onClick={() => setShowRejectModal(true)}
            className="w-full md:w-auto bg-white border border-zinc-200 text-zinc-400 px-16 py-5 rounded-lg text-[11px] font-black  tracking-[0.4em] hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-4 group"
           >
             <span className="material-symbols-outlined text-[20px] group-hover:animate-pulse">rate_review</span>
             Solicitar Ajustes
           </button>
        </div>
      </div>

      <div className="mt-16 text-center space-y-2">
         <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.3em] opacity-50">BY PROCAMPO DEL CARIBE S.A.S.</p>
      </div>

      {/* Approve Modal - Premium Style */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center p-6 z-[110] animate-in fade-in duration-300">
          <div className="bg-white border border-zinc-100 w-full max-w-lg p-12 rounded-lg shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-3xl font-black  tracking-tighter mb-6 text-zinc-900">Aceptación de Términos</h3>
            <p className="text-xs text-zinc-500 font-bold mb-10  tracking-widest leading-relaxed">¿Desea proceder con la formalización de este proyecto? Al confirmar, acepta los términos y condiciones legales y el proceso de reserva de inventario se activará de forma inmediata.</p>
            <div className="flex flex-col gap-4">
              <button
                disabled={processing}
                onClick={handleApprove}
                className="bg-[#fbae17] text-white py-4 rounded-lg text-xs font-black  tracking-[0.3em] hover:opacity-90 disabled:opacity-50 shadow-lg border-b-4 border-black/5"
              >
                Continuar a Formalización
              </button>
              <button
                disabled={processing}
                onClick={() => setShowApproveModal(false)}
                className="bg-zinc-50 text-zinc-400 py-4 rounded-lg text-xs font-black  tracking-[0.3em] hover:bg-zinc-100 transition-all border border-zinc-100"
              >
                Volver a la Propuesta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal - Premium Style */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center p-6 z-[110] animate-in fade-in duration-300">
          <div className="bg-white border border-zinc-100 w-full max-w-xl p-12 rounded-lg shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-6">
               <div className="size-10 bg-primary/10 flex items-center justify-center rounded-lg">
                  <span className="material-symbols-outlined text-primary text-[24px]">cloud_upload</span>
               </div>
               <h3 className="text-3xl font-black  tracking-tighter text-zinc-900 leading-none">Cargar Orden de Compra</h3>
            </div>

            <p className="text-xs text-zinc-500 font-bold mb-10  tracking-widest leading-relaxed">
              Para finalizar la legalización del evento, por favor adjunte el documento de su Orden de Compra (PDF o Imagen).
              <span className="block mt-4 text-primary">También puedes enviarla a: <span className="underline">hola@sunpartners.com.co</span></span>
            </p>

            <div className="space-y-8">
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setOcFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed ${ocFile ? 'border-primary bg-primary/5' : 'border-zinc-200 group-hover:border-primary group-hover:bg-zinc-50'} rounded-xl p-10 transition-all text-center`}>
                   <span className="material-symbols-outlined text-4xl text-zinc-300 mb-4 block group-hover:text-primary transition-colors">
                     {ocFile ? 'description' : 'upload_file'}
                   </span>
                   <p className="text-xs font-black  tracking-widest text-zinc-400">
                     {ocFile ? ocFile.name : 'Seleccionar Archivo (PDF, JPG, PNG)'}
                   </p>
                   {ocFile && (
                     <p className="text-[10px] text-primary font-bold mt-2 ">Archivo seleccionado correctamente</p>
                   )}
                </div>
              </div>

              <div className="flex flex-col gap-4 pt-4">
                <button
                  disabled={processing || !ocFile}
                  onClick={handleFormalize}
                  className="w-full bg-[#fbae17] text-white py-5 rounded-lg text-xs font-black  tracking-[0.4em] hover:opacity-90 disabled:opacity-50 shadow-lg border-b-4 border-black/5 flex items-center justify-center gap-4"
                >
                  {processing ? 'Procesando...' : 'Legalizar y Finalizar'}
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </button>
                <button
                  disabled={processing}
                  onClick={() => { setShowUploadModal(false); setOcFile(null); }}
                  className="w-full bg-white text-zinc-400 py-4 rounded-lg text-xs font-black  tracking-[0.3em] hover:bg-zinc-50 transition-all border border-zinc-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal - Premium Style */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center p-6 z-[110] animate-in fade-in duration-300">
          <div className="bg-white border border-zinc-100 w-full max-w-2xl p-12 rounded-lg shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-3xl font-black  tracking-tighter mb-6 text-red-500">Solicitud de Ajustes</h3>
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] font-black  tracking-[0.4em] text-zinc-400 mb-4">Motivo de la Revisión</label>
                <select
                  value={rejection.type}
                  onChange={e => setRejection({...rejection, type: e.target.value})}
                  className="w-full border border-zinc-200 bg-zinc-50 rounded-lg px-6 py-4 text-xs font-black  tracking-widest outline-none focus:border-primary transition-all"
                >
                  <option value="CANTIDADES">Ajuste de Cantidades</option>
                  <option value="PRODUCTOS">Modificar Productos / Equipamiento</option>
                  <option value="FECHAS">Ajuste de Fechas y Horarios</option>
                  <option value="LOGISTICA">Cambio de Lugar o Logística</option>
                  <option value="OTROS">Otros Requerimientos</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black  tracking-[0.4em] text-zinc-400 mb-4">Comentarios del Cliente</label>
                <textarea
                  rows="5"
                  value={rejection.reason}
                  onChange={e => setRejection({...rejection, reason: e.target.value})}
                  className="w-full border border-zinc-200 rounded-lg p-6 text-sm font-medium outline-none focus:border-primary transition-all placeholder:text-zinc-300"
                  placeholder="Por favor, detalle los cambios requeridos para que nuestro equipo pueda actualizar su propuesta técnica..."
                ></textarea>
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  disabled={processing}
                  onClick={handleReject}
                  className="flex-1 bg-zinc-900 text-white py-4 rounded-lg text-xs font-black  tracking-[0.3em] hover:bg-red-500 disabled:opacity-50 transition-all shadow-lg"
                >
                  {processing ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
                <button
                  disabled={processing}
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 bg-zinc-50 text-zinc-400 py-4 rounded-lg text-xs font-black  tracking-[0.3em] hover:bg-zinc-100 transition-all border border-zinc-100"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicQuotation;
