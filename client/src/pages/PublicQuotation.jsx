import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const PublicQuotation = () => {
  const { hash } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejection, setRejection] = useState({ type: 'PRECIO', reason: '' });
  const [processing, setProcessing] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await axios.get(`/api/quotations/public/${hash}`);
        setQuotation(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo cargar la cotización');
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [hash]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await axios.post(`/api/quotations/public/${hash}/approve`);
      setFinished(true);
      setShowApproveModal(false);
    } catch (err) {
      alert('Error al aprobar');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejection.reason && rejection.type === 'OTRO') {
      alert('Por favor, especifica el motivo');
      return;
    }
    setProcessing(true);
    try {
      await axios.post(`/api/quotations/public/${hash}/reject`, {
        rejectionType: rejection.type,
        rejectionReason: rejection.reason
      });
      setFinished(true);
      setShowRejectModal(false);
    } catch (err) {
      alert('Error al enviar solicitud');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-body italic text-zinc-400">Verificando credenciales de acceso...</div>;
  if (error) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-body text-red-500 font-bold uppercase tracking-widest">{error}</div>;

  if (finished) {
    return (
      <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center font-body p-8 text-center">
         <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center mb-8 border-2 border-primary/50">
            <span className="material-symbols-outlined text-primary text-[40px] font-black">check_circle</span>
         </div>
         <h2 className="text-white text-3xl font-black uppercase tracking-tighter mb-4">¡Gestión Completada!</h2>
         <p className="text-zinc-400 max-w-md mx-auto font-bold uppercase text-xs tracking-widest leading-relaxed">Tu respuesta ha sido registrada exitosamente. El equipo de Sunpartners se pondrá en contacto contigo en breve para los siguientes pasos.</p>
         <div className="mt-12 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Sunpartners SaaS • Estándar de Excelencia</div>
      </div>
    );
  }

  const subtotalItems = (quotation.items || []).reduce((acc, item) => acc + (item.cantidad * item.precio_pactado), 0);
  const subtotalServices = (quotation.services || []).reduce((acc, svc) => acc + (svc.cantidad * svc.precio_pactado), 0);
  const subtotal = subtotalItems + subtotalServices;
  const iva = subtotal * 0.19;
  const total = subtotal + iva;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-body p-4 md:p-12">
      <div className="max-w-5xl mx-auto bg-white border border-zinc-200 rounded shadow-sm overflow-hidden">
        {/* Public Header */}
        <div className="p-8 md:p-12 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start gap-8">
           <div>
              <div className="flex items-center gap-3 mb-8">
                 <div className="size-10 bg-zinc-900 flex items-center justify-center rounded-sm">
                    <span className="material-symbols-outlined text-white text-[24px]">dataset</span>
                 </div>
                 <h1 className="text-xl font-black uppercase tracking-[0.2em] text-zinc-900">SUNPARTNERS</h1>
              </div>
              <div className="space-y-1">
                 <h2 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">{quotation.nombre_evento}</h2>
                 <p className="text-xs font-black text-primary uppercase tracking-widest">Cotización #Q-{quotation.id.substring(0,6).toUpperCase()}</p>
              </div>
           </div>
           <div className="text-left md:text-right space-y-4">
              <div>
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Cliente</span>
                 <p className="text-sm font-bold text-zinc-900 uppercase">{quotation.client.empresa}</p>
                 <p className="text-xs font-medium text-zinc-500">{quotation.client.nit}</p>
              </div>
              <div>
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Fecha del Evento</span>
                 <p className="text-sm font-bold text-zinc-900">{new Date(quotation.fecha_inicio).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
           </div>
        </div>

        {/* Items Table */}
        <div className="p-8 md:p-12">
           <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Descripción del Artículo / Servicio</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Cant.</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Vlr. Unitario</th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {(quotation.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-6">
                       <p className="font-bold text-sm text-zinc-900">{item.inventory.nombre}</p>
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Categoría: Equipamiento Estándar</span>
                    </td>
                    <td className="py-6 text-center font-bold text-sm text-zinc-600">{item.cantidad}</td>
                    <td className="py-6 text-right font-bold text-sm text-zinc-600">$ {item.precio_pactado.toLocaleString()}</td>
                    <td className="py-6 text-right font-black text-sm text-zinc-900">$ {(item.cantidad * item.precio_pactado).toLocaleString()}</td>
                  </tr>
                ))}
                {(quotation.services || []).map((svc, idx) => (
                  <tr key={idx}>
                    <td className="py-6">
                       <p className="font-bold text-sm text-zinc-900">{svc.descripcion}</p>
                       <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{svc.tipo} Especializado</span>
                    </td>
                    <td className="py-6 text-center font-bold text-sm text-zinc-600">{svc.cantidad}</td>
                    <td className="py-6 text-right font-bold text-sm text-zinc-600">$ {svc.precio_pactado.toLocaleString()}</td>
                    <td className="py-6 text-right font-black text-sm text-zinc-900">$ {(svc.cantidad * svc.precio_pactado).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>

        {/* Totals & T&C Block */}
        <div className="bg-zinc-50/50 p-8 md:p-12 border-t border-zinc-100 flex flex-col md:flex-row justify-between gap-12">
           <div className="max-w-xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 mb-6">Términos y Condiciones del Servicio</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  "La reserva se confirma con el pago del 50% del valor total.",
                  "Precios sujetos a disponibilidad al momento del pago.",
                  "Cancelaciones con menos de 48h incurren en penalidad del 30%.",
                  "El cliente es responsable por daños o pérdida de equipos.",
                  "Horarios de montaje y desmontaje deben respetarse estrictamente.",
                  "Personal técnico incluido solo si se especifica en servicios.",
                  "Esta cotización tiene una validez de 5 días hábiles.",
                  "No se permiten subarriendos de los equipos contratados.",
                  "Sunpartners no se hace responsable por fallas eléctricas externas.",
                  "El saldo restante debe pagarse antes del inicio del montaje."
                ].map((text, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-[10px] font-black text-primary">{i+1}.</span>
                    <p className="text-[10px] leading-tight text-zinc-500 font-bold uppercase">{text}</p>
                  </div>
                ))}
              </div>
           </div>
           <div className="min-w-[280px] space-y-4">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-zinc-400">
                <span>Subtotal Neto</span>
                <span className="text-zinc-900">$ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-zinc-400">
                <span>IVA (19%)</span>
                <span className="text-zinc-900">$ {iva.toLocaleString()}</span>
              </div>
              <div className="pt-4 border-t border-zinc-200 flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Total Final</span>
                <span className="text-4xl font-black tracking-tighter text-zinc-900">$ {total.toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* Final Actions */}
        <div className="p-12 flex flex-col md:flex-row justify-center items-center gap-6 border-t border-zinc-100 bg-white">
           <button
            onClick={() => setShowApproveModal(true)}
            className="w-full md:w-auto bg-zinc-900 text-white px-12 py-4 rounded-sm text-xs font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-xl flex items-center justify-center gap-3"
           >
             <span className="material-symbols-outlined text-[20px]">check_circle</span>
             Aprobar Cotización
           </button>
           <button
            onClick={() => setShowRejectModal(true)}
            className="w-full md:w-auto bg-white border-2 border-zinc-200 text-zinc-400 px-12 py-4 rounded-sm text-xs font-black uppercase tracking-[0.2em] hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-3"
           >
             <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
             Solicitar Ajustes
           </button>
        </div>
      </div>

      <div className="mt-12 text-center">
         <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em]">Powered by Sunpartners SaaS Engine v2.0</p>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-zinc-900 w-full max-w-md p-8 rounded-sm animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Confirmar Aprobación</h3>
            <p className="text-sm text-zinc-500 font-bold mb-8 uppercase tracking-tight leading-relaxed">¿Deseas confirmar la reserva de equipos y servicios para este evento? Al aprobar, el equipo de Sunpartners iniciará el proceso logístico.</p>
            <div className="flex gap-4">
              <button
                disabled={processing}
                onClick={handleApprove}
                className="flex-1 bg-zinc-900 text-white py-3 rounded-sm text-xs font-black uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50"
              >
                {processing ? 'Procesando...' : 'Confirmar'}
              </button>
              <button
                disabled={processing}
                onClick={() => setShowApproveModal(false)}
                className="flex-1 bg-zinc-100 text-zinc-900 py-3 rounded-sm text-xs font-black uppercase tracking-widest hover:bg-zinc-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-zinc-900 w-full max-w-lg p-8 rounded-sm animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black uppercase tracking-tighter mb-4 text-red-600">Solicitar Ajustes</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Motivo Principal</label>
                <select
                  value={rejection.type}
                  onChange={e => setRejection({...rejection, type: e.target.value})}
                  className="w-full border-2 border-zinc-100 rounded-sm px-4 py-3 text-sm font-bold uppercase outline-none focus:border-zinc-900"
                >
                  <option value="PRECIO">Optimización de Presupuesto</option>
                  <option value="FECHAS">Cambio de Fechas / Horarios</option>
                  <option value="CAMBIO_PLAN">Ajuste en la Selección de Equipos</option>
                  <option value="OTRO">Otro Motivo</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Detalles del Ajuste</label>
                <textarea
                  rows="4"
                  value={rejection.reason}
                  onChange={e => setRejection({...rejection, reason: e.target.value})}
                  className="w-full border-2 border-zinc-100 rounded-sm px-4 py-3 text-sm font-medium outline-none focus:border-zinc-900"
                  placeholder="Por favor, describe qué cambios necesitas para que podamos actualizar la propuesta..."
                ></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  disabled={processing}
                  onClick={handleReject}
                  className="flex-1 bg-zinc-900 text-white py-3 rounded-sm text-xs font-black uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50"
                >
                  {processing ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
                <button
                  disabled={processing}
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 bg-zinc-100 text-zinc-900 py-3 rounded-sm text-xs font-black uppercase tracking-widest hover:bg-zinc-200"
                >
                  Regresar
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
