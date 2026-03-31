import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const QuotationList = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const res = await axios.get('/api/quotations', { withCredentials: true });
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
    fetchQuotations();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      BORRADOR: 'bg-zinc-100 text-zinc-600',
      ENVIADA: 'bg-blue-50 text-blue-600',
      APROBADA: 'bg-green-50 text-green-600',
      EJECUCION: 'bg-primary/10 text-primary',
      FINALIZADA: 'bg-zinc-900 text-zinc-50',
      CANCELADA: 'bg-red-50 text-red-600',
    };
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles[status] || 'bg-zinc-100 text-zinc-600'}`}>{status}</span>;
  };

  if (loading) return <div className="p-8 font-body text-zinc-500">Cargando cotizaciones...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900">Cotizaciones</h2>
          <p className="text-sm text-zinc-500 font-body mt-1">Gestión del motor de negocio y eventos.</p>
        </div>
        <button
          onClick={() => navigate('/cotizaciones/nueva')}
          className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva Cotización
        </button>
      </div>

      <div className="bg-white border border-zinc-200 rounded overflow-hidden">
        <table className="w-full text-left font-body text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-4">Evento / Cliente</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {quotations.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-zinc-400">No hay cotizaciones registradas.</td>
              </tr>
            ) : (
              quotations.map((q) => (
                <tr
                  key={q.id}
                  className="hover:bg-zinc-50/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/cotizaciones/${q.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-900">{q.nombre_evento}</span>
                      <span className="text-xs text-zinc-500">{q.client.razon_social}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-zinc-700">
                        {q.evento_inicio ? new Date(q.evento_inicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'PEND'} - {q.evento_fin ? new Date(q.evento_fin).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'PEND'}
                      </span>
                      <span className="text-[10px] text-zinc-400 uppercase font-medium">{q.evento_inicio ? new Date(q.evento_inicio).getFullYear() : '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(q.estado)}</td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-600 font-medium">{(q.items?.length || 0) + (q.services?.length || 0)} líneas</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-zinc-900">
                      $ {((q.items?.reduce((acc, it) => acc + (it.cantidad * it.precio_pactado), 0) || 0) + (q.services?.reduce((acc, sv) => acc + (sv.cantidad * sv.precio_pactado), 0) || 0)).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="material-symbols-outlined text-zinc-400 text-[18px]">chevron_right</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationList;
