import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from '../components/ui/Modal';

const Planner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uiModal, setUiModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });

  // Planner States
  const [materiales, setMateriales] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [cronograma, setCronograma] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/quotations/${id}`, { withCredentials: true });
        const q = res.data;
        setQuotation(q);

        // Hydrate from existing planning or explode from quotation
        if (q.planning) {
          setMateriales(q.planning.materiales || []);
          setPersonal(q.planning.personal || []);
          setCronograma(q.planning.cronograma || '');
        } else {
          // EXPLOSION LOGIC (v50.0)
          const exploded = [];
          q.items.forEach(item => {
            if (item.isComposition) {
               // Decompose recipe
               const pieces = item.compositions || item.inventory?.compositions || [];
               pieces.forEach(p => {
                  exploded.push({
                    id: crypto.randomUUID(),
                    nombre: p.componentCatalogItem?.nombre_comercial || p.warehouseItem?.nombre || p.nombre || 'Pieza de Set',
                    cantidad: (p.quantity || 1) * item.cantidad,
                    isExternal: p.componentCatalogItem?.isExternal || false,
                    costo: p.componentCatalogItem?.vendorCost || 0,
                    proveedor: '',
                    notas: `De: ${item.customName || item.inventory?.nombre_comercial}`,
                    originalQuotationItemId: item.id
                  });
               });
            } else {
               // Simple item
               exploded.push({
                  id: crypto.randomUUID(),
                  nombre: item.customName || item.inventory?.nombre_comercial,
                  cantidad: item.cantidad,
                  isExternal: item.isExternal || item.inventory?.isExternal || false,
                  costo: item.vendorCost || item.inventory?.vendorCost || 0,
                  proveedor: '',
                  notas: '',
                  originalQuotationItemId: item.id
               });
            }
          });
          setMateriales(exploded);
          setPersonal([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/quotations/${id}/planning`, {
        materiales,
        personal,
        cronograma
      }, { withCredentials: true });

      setUiModal({
        isOpen: true,
        title: 'Planeación Guardada',
        content: 'La hoja de ruta operativa ha sido actualizada correctamente.',
        type: 'success'
      });
    } catch (err) {
       setUiModal({
         isOpen: true,
         title: 'Error de Guardado',
         content: 'No se pudo persistir la planeación. Revisa tu conexión.',
         type: 'error'
       });
    } finally {
      setSaving(false);
    }
  };

  const addManualItem = () => {
    setMateriales([...materiales, {
      id: crypto.randomUUID(),
      nombre: '',
      cantidad: 1,
      isExternal: false,
      costo: 0,
      proveedor: '',
      notas: 'Manual',
      isManual: true
    }]);
  };

  const addPersonnel = () => {
    setPersonal([...personal, {
      id: crypto.randomUUID(),
      nombre: '',
      pago: 0,
      rol: 'Montaje'
    }]);
  };

  const removeItem = (list, setList, itemId) => {
    setList(list.filter(i => i.id !== itemId));
  };

  const updateItem = (list, setList, itemId, field, value) => {
    setList(list.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  };

  if (loading || !quotation) return <div className="p-20 text-center font-display text-zinc-400">INFLANDO PLANEADOR...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F4F5] font-body">
      <Modal isOpen={uiModal.isOpen} onClose={() => setUiModal({ ...uiModal, isOpen: false })} title={uiModal.title} type={uiModal.type}>{uiModal.content}</Modal>

      {/* Persistent Operational Header */}
      <header className="bg-white border-b border-zinc-200 px-12 py-8 shrink-0 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-6">
              <button onClick={() => navigate(`/cotizaciones/${id}`)} className="size-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <div className="flex items-center gap-3">
                   <h2 className="text-2xl font-black tracking-tighter text-zinc-900">Planeador Logístico</h2>
                   <span className="px-2 py-1 bg-zinc-900 text-white text-[10px] font-black rounded tracking-widest uppercase">
                     {quotation.consecutivo ? `SP-${quotation.consecutivo}` : `#Q-${quotation.id.substring(0,6).toUpperCase()}`}
                   </span>
                </div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">{quotation.nombre_evento} • {quotation.client.razon_social}</p>
              </div>
           </div>
           <button
             onClick={handleSave}
             disabled={saving}
             className="bg-primary text-white px-10 py-3 rounded-lg text-[11px] font-black tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
           >
             <span className="material-symbols-outlined text-[20px]">{saving ? 'sync' : 'save'}</span>
             {saving ? 'SINCRONIZANDO...' : 'GUARDAR HOJA DE RUTA'}
           </button>
        </div>

        {/* Operational Dates Bar */}
        <div className="flex items-center gap-12 mt-8 pt-6 border-t border-zinc-100 overflow-x-auto pb-2">
           {[
             { label: 'MONTAJE', date: quotation.montaje_inicio, icon: 'build' },
             { label: 'EVENTO', date: quotation.evento_inicio, icon: 'celebration' },
             { label: 'DESMONTAJE', date: quotation.desmontaje_fin, icon: 'restart_alt' }
           ].map((d, i) => (
             <div key={i} className="flex items-center gap-4 shrink-0">
                <div className="size-8 rounded bg-zinc-50 flex items-center justify-center text-zinc-400">
                   <span className="material-symbols-outlined text-[18px]">{d.icon}</span>
                </div>
                <div>
                   <p className="text-[9px] font-black text-zinc-400 tracking-widest uppercase">{d.label}</p>
                   <p className="text-[11px] font-black text-zinc-900">{new Date(d.date).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
             </div>
           ))}
        </div>
      </header>

      <main className="flex-1 p-12 max-w-7xl mx-auto w-full space-y-12">

        {/* MATERIAL EXPLOSION SECTION */}
        <section className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
           <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-3">
                 <span className="material-symbols-outlined text-primary">inventory_2</span>
                 <h3 className="text-sm font-black tracking-widest text-zinc-900">LISTADO DE EQUIPAMIENTO (EXPLOSIÓN)</h3>
              </div>
              <button onClick={addManualItem} className="text-[10px] font-black text-primary hover:underline flex items-center gap-1">
                 <span className="material-symbols-outlined text-[16px]">add_circle</span>
                 AÑADIR MANUAL (NO COBRABLE)
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                 <thead>
                    <tr className="bg-zinc-50 text-[10px] font-black tracking-widest text-zinc-400 border-b border-zinc-100">
                       <th className="px-8 py-4">ÍTEM / PRODUCTO</th>
                       <th className="px-4 py-4 text-center w-[80px]">CANT</th>
                       <th className="px-4 py-4 w-[120px]">TIPO</th>
                       <th className="px-4 py-4 w-[150px]">PROVEEDOR</th>
                       <th className="px-4 py-4 w-[120px] text-right">COSTO</th>
                       <th className="px-4 py-4">NOTAS OPERATIVAS</th>
                       <th className="px-4 py-4 text-center w-[60px]"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-50">
                    {materiales.map(item => (
                       <tr key={item.id} className={`hover:bg-zinc-50/50 transition-colors ${item.isManual ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-8 py-4">
                             <input
                               value={item.nombre}
                               onChange={e => updateItem(materiales, setMateriales, item.id, 'nombre', e.target.value)}
                               className="w-full bg-transparent font-bold text-zinc-900 outline-none focus:text-primary transition-colors uppercase placeholder:text-zinc-300"
                               placeholder="Nombre del ítem..."
                             />
                          </td>
                          <td className="px-4 py-4">
                             <input
                               type="number"
                               value={item.cantidad}
                               onChange={e => updateItem(materiales, setMateriales, item.id, 'cantidad', parseInt(e.target.value) || 0)}
                               className="w-full text-center bg-zinc-100 rounded p-1 font-black outline-none"
                             />
                          </td>
                          <td className="px-4 py-4">
                             <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black border ${item.isExternal ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                                {item.isExternal ? 'EXTERNO' : 'SUNPARTNERS'}
                             </span>
                          </td>
                          <td className="px-4 py-4">
                             {item.isExternal ? (
                                <input
                                  value={item.proveedor || ''}
                                  onChange={e => updateItem(materiales, setMateriales, item.id, 'proveedor', e.target.value)}
                                  className="w-full bg-white border border-zinc-200 rounded p-1 text-[10px] outline-none focus:border-primary"
                                  placeholder="Nombre proveedor..."
                                />
                             ) : <span className="text-[10px] text-zinc-300 font-bold italic">N/A</span>}
                          </td>
                          <td className="px-4 py-4 text-right">
                             {item.isExternal ? (
                                <div className="flex items-center justify-end gap-1">
                                   <span className="text-zinc-400 font-bold">$</span>
                                   <input
                                     type="number"
                                     value={item.costo}
                                     onChange={e => updateItem(materiales, setMateriales, item.id, 'costo', parseFloat(e.target.value) || 0)}
                                     className="w-20 text-right bg-white border border-zinc-200 rounded p-1 text-[11px] font-black outline-none focus:border-primary"
                                   />
                                </div>
                             ) : <span className="text-zinc-300 font-bold">---</span>}
                          </td>
                          <td className="px-4 py-4">
                             <input
                               value={item.notas || ''}
                               onChange={e => updateItem(materiales, setMateriales, item.id, 'notas', e.target.value)}
                               className="w-full bg-transparent text-[11px] text-zinc-500 italic outline-none focus:text-zinc-900"
                               placeholder="Ej: Revisar cables, Empacar en caja azul..."
                             />
                          </td>
                          <td className="px-4 py-4 text-center">
                             <button onClick={() => removeItem(materiales, setMateriales, item.id)} className="text-zinc-300 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </section>

        {/* LOGISTICS PERSONNEL SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
           <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden h-fit">
              <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                 <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">groups</span>
                    <h3 className="text-sm font-black tracking-widest text-zinc-900">PERSONAL LOGÍSTICO</h3>
                 </div>
                 <button onClick={addPersonnel} className="text-[10px] font-black text-primary hover:underline flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    AÑADIR PERSONAL
                 </button>
              </div>
              <div className="p-4 space-y-3">
                 {personal.length === 0 ? (
                    <div className="text-center py-10">
                       <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Sin personal asignado</p>
                    </div>
                 ) : (
                    personal.map(p => (
                       <div key={p.id} className="flex items-center gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-100">
                          <div className="flex-1">
                             <label className="block text-[8px] font-black text-zinc-400 uppercase mb-1">Nombre</label>
                             <input
                               value={p.nombre}
                               onChange={e => updateItem(personal, setPersonal, p.id, 'nombre', e.target.value)}
                               className="w-full bg-transparent font-bold text-zinc-900 outline-none placeholder:text-zinc-300"
                               placeholder="Ej: Anthony..."
                             />
                          </div>
                          <div className="w-[120px]">
                             <label className="block text-[8px] font-black text-zinc-400 uppercase mb-1">Rol</label>
                             <select
                               value={p.rol}
                               onChange={e => updateItem(personal, setPersonal, p.id, 'rol', e.target.value)}
                               className="w-full bg-transparent text-[10px] font-black outline-none appearance-none cursor-pointer"
                             >
                                <option value="Montaje">Montaje</option>
                                <option value="Operación">Operación</option>
                                <option value="Desmontaje">Desmontaje</option>
                                <option value="Coordinador">Coordinador</option>
                             </select>
                          </div>
                          <div className="w-[120px]">
                             <label className="block text-[8px] font-black text-zinc-400 uppercase mb-1">Pago/Costo</label>
                             <div className="flex items-center gap-1">
                                <span className="text-zinc-400 font-bold">$</span>
                                <input
                                  type="number"
                                  value={p.pago}
                                  onChange={e => updateItem(personal, setPersonal, p.id, 'pago', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-white border border-zinc-200 rounded p-1 text-[11px] font-black outline-none"
                                />
                             </div>
                          </div>
                          <button onClick={() => removeItem(personal, setPersonal, p.id)} className="text-zinc-300 hover:text-red-500 transition-colors pt-4">
                             <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                       </div>
                    ))
                 )}
              </div>
           </div>

           <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden h-fit">
              <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50">
                 <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">description</span>
                    <h3 className="text-sm font-black tracking-widest text-zinc-900">NOTAS DE CRONOGRAMA</h3>
                 </div>
              </div>
              <div className="p-8">
                 <textarea
                   rows="10"
                   value={cronograma}
                   onChange={e => setCronograma(e.target.value)}
                   className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-xl p-6 text-sm font-medium outline-none focus:border-primary transition-all placeholder:text-zinc-300"
                   placeholder="Detalla aquí los tiempos de carga, rutas, hitos del evento y cualquier detalle crítico de la operación..."
                 ></textarea>
              </div>
           </div>
        </section>

        <div className="pb-20"></div>
      </main>
    </div>
  );
};

export default Planner;
