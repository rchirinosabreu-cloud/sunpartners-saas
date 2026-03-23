import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { generateQuotationPDF } from '../utils/pdfGenerator';

const QuotationDetail = () => {
  const { id } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cotizador');
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    try {
      const res = await axios.get(`/api/quotations/${id}`, { withCredentials: true });
      setQuotation(res.data);
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
      await fetchQuotation();
    } catch (err) {
      alert(err.response?.data?.details || 'Error al cambiar estado');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 font-body text-zinc-500">Cargando detalles...</div>;
  if (!quotation) return <div className="p-8 font-body text-red-500 text-center">Cotización no encontrada.</div>;

  const total = quotation.items.reduce((acc, item) => acc + (item.cantidad * item.precio_pactado), 0);

  const tabs = [
    { id: 'cotizador', label: 'Cotizador', icon: 'receipt_long' },
    { id: 'inventario', label: 'Inventario', icon: 'inventory_2' },
    { id: 'planeador', label: 'Planeador (SS)', icon: 'event_available' },
    { id: 'bitacora', label: 'Bitácora', icon: 'history' },
  ];

  return (
    <div className="flex flex-col h-full bg-background-light">
      {/* Detail Header */}
      <div className="bg-white border-b border-zinc-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cotizaciones')}
              className="size-8 flex items-center justify-center rounded border border-zinc-200 text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">{quotation.nombre_evento}</h2>
              <p className="text-xs text-zinc-500 font-body uppercase tracking-wider font-medium">{quotation.client.nombre} • #{quotation.id.substring(0,8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1 rounded bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold uppercase tracking-wider">
               {quotation.estado}
             </div>
             <button
                onClick={() => generateQuotationPDF(quotation)}
                className="flex items-center gap-2 border border-zinc-200 px-4 py-1.5 rounded text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors shadow-sm"
             >
               <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
               Descargar PDF
             </button>
             {quotation.estado === 'BORRADOR' && (
               <button
                onClick={() => handleStatusChange('APROBADA')}
                disabled={updating}
                className="bg-primary text-white px-4 py-1.5 rounded text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity shadow-sm"
               >
                 Aprobar Evento
               </button>
             )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-t border-zinc-100 pt-4 gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-primary text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}
            >
              <span className={`material-symbols-outlined text-[18px] ${activeTab === tab.id ? 'fill' : ''}`}>{tab.icon}</span>
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
              <div className="bg-white border border-zinc-200 rounded p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-primary text-[20px] fill">receipt</span>
                  Resumen de Items
                </h3>
                <div className="space-y-4">
                  {quotation.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900">{item.inventory.nombre}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${item.clase_asignada === 'A' ? 'bg-primary/10 text-primary' : 'bg-alert/10 text-alert'}`}>Clase {item.clase_asignada}</span>
                          <span className="text-xs text-zinc-400 font-medium">Cant: {item.cantidad}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold text-zinc-900">$ {(item.precio_pactado * item.cantidad).toLocaleString()}</span>
                        <span className="text-[10px] text-zinc-400">$ {item.precio_pactado.toLocaleString()} /u</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-zinc-900 text-zinc-50 rounded p-6 shadow-md">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-6">Detalles Financieros</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="font-medium">$ {(total / 1.19).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400">IVA (19%)</span>
                    <span className="font-medium">$ {(total - (total / 1.19)).toLocaleString()}</span>
                  </div>
                  <div className="h-px bg-zinc-800 my-4"></div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase text-primary">Total Final</span>
                    <span className="text-2xl font-bold tracking-tight text-white">$ {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 rounded p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
                   <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                   Fechas Programadas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Inicio</span>
                    <span className="text-sm font-semibold text-zinc-900">{new Date(quotation.fecha_inicio).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Fin</span>
                    <span className="text-sm font-semibold text-zinc-900">{new Date(quotation.fecha_fin).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventario' && (
          <div className="max-w-4xl mx-auto space-y-6">
             <div className="bg-white border border-zinc-200 rounded p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold text-zinc-900 mb-6 uppercase tracking-wide">Validación de Stock</h3>
                <table className="w-full text-left text-sm">
                  <thead className="text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-100">
                    <tr>
                      <th className="pb-4">Artículo</th>
                      <th className="pb-4">Requerido</th>
                      <th className="pb-4">Bucket Asignado</th>
                      <th className="pb-4">Estado Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {quotation.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-4 font-semibold text-zinc-900">{item.inventory.nombre}</td>
                        <td className="py-4 text-zinc-600">{item.cantidad} und.</td>
                        <td className="py-4">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.clase_asignada === 'A' ? 'bg-primary text-white' : 'bg-alert text-white'}`}>CLASE {item.clase_asignada}</span>
                        </td>
                        <td className="py-4">
                           <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                             <span className="material-symbols-outlined text-[16px]">check_circle</span>
                             RESERVADO
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'bitacora' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="font-display text-lg font-bold text-zinc-900 uppercase tracking-wide mb-8">Historial de Evento</h3>
            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-200">
              {quotation.logs.map((log, idx) => (
                <div key={idx} className="relative pl-10">
                  <div className="absolute left-0 top-1.5 size-6 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center">
                    <div className="size-2 rounded-full bg-zinc-400"></div>
                  </div>
                  <div className="bg-zinc-50/50 border border-zinc-100 p-4 rounded">
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] text-zinc-400 font-medium">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-zinc-700 font-body leading-relaxed">{log.message}</p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                       <span className="material-symbols-outlined text-[14px]">person</span>
                       {log.user.nombre}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === 'planeador' || activeTab === 'bitacora' && quotation.logs.length === 0) && (
           <div className="p-12 text-center text-zinc-400 italic">Módulo de {activeTab} en etapa de definición...</div>
        )}
      </div>
    </div>
  );
};

export default QuotationDetail;
