import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Modal from '../components/ui/Modal';
import { generatePlannerPDF } from '../utils/pdfGenerator';

const DEFAULT_BUDGET_ROWS = [
  { id: 'sub', concepto: 'Subcontratación', indicaciones: '', montaje: 0, evento: 0, desmontaje: 0 },
  { id: 'mat', concepto: 'Materiales', indicaciones: '', montaje: 0, evento: 0, desmontaje: 0 },
  { id: 'per', concepto: 'Personal', indicaciones: '', montaje: 0, evento: 0, desmontaje: 0 },
  { id: 'tra', concepto: 'Transporte/Peajes/Combustible', indicaciones: '', montaje: 0, evento: 0, desmontaje: 0 },
  { id: 'ali', concepto: 'Viáticos: transporte + alimentación logísticos', indicaciones: '', montaje: 0, evento: 0, desmontaje: 0 },
  { id: 'alo', concepto: 'Alojamiento', indicaciones: '', montaje: 0, evento: 0, desmontaje: 0 },
];

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
  const [presupuesto, setPresupuesto] = useState(DEFAULT_BUDGET_ROWS);
  const [cronograma, setCronograma] = useState('');
  const [footer, setFooter] = useState({ elaboro: '', reviso: '', verifico: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/quotations/${id}`, { withCredentials: true });
        const q = res.data;
        setQuotation(q);

        if (q.planning) {
          setPersonal(q.planning.personal || []);
          setCronograma(q.planning.cronograma || '');
          setPresupuesto(q.planning.presupuesto || DEFAULT_BUDGET_ROWS);
          setFooter(q.planning.footer || { elaboro: '', reviso: '', verifico: '' });

          if (q.planning.materiales && q.planning.materiales.length > 0) {
            setMateriales(q.planning.materiales);
          } else {
             explodeQuotation(q);
          }
        } else {
          explodeQuotation(q);
          setPersonal([]);
          setPresupuesto(DEFAULT_BUDGET_ROWS);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // AUTO-CALCULATION: Mirroring Section 5 (Personal) to Budget Table Cells
  useEffect(() => {
    const sumPhasePersonal = (phase) => personal.reduce((acc, p) => acc + (parseFloat(p[phase]) || 0), 0);

    setPresupuesto(prev => prev.map(row => {
      if (row.id === 'per') {
        return {
          ...row,
          montaje: sumPhasePersonal('montaje'),
          evento: sumPhasePersonal('evento'),
          desmontaje: sumPhasePersonal('desmontaje')
        };
      }
      return row;
    }));
  }, [personal]);

  const getTheoreticalExplosion = (q) => {
    const exploded = [];
    (q.items || []).forEach(item => {
      const itemIsExternal = !!(item.isExternal || item.inventory?.isExternal);
      const itemProvider = itemIsExternal ? (item.vendorName || item.inventory?.vendorName || 'POR DEFINIR') : 'SUN PARTNERS';
      const itemCost = itemIsExternal ? (item.vendorCost || item.inventory?.vendorCost || 0) : 0;

      if (item.isComposition) {
        // v52.1: Fix data route - empty arrays must fall back to catalog
        const pieces = (item.compositions && item.compositions.length > 0)
          ? item.compositions
          : (item.inventory?.compositions || []);

        if (pieces.length === 0) {
          exploded.push({
            id: crypto.randomUUID(),
            category: 'EQUIPAMIENTO',
            nombre: item.customName || item.inventory?.nombre_comercial,
            cantidad: item.cantidad,
            isExternal: itemIsExternal,
            costo: itemCost,
            proveedor: itemProvider,
            notas: 'Fallback: Composición sin desglose',
            originalQuotationItemId: item.id
          });
        } else {
          if (itemIsExternal) {
            exploded.push({
              id: crypto.randomUUID(),
              category: 'EQUIPAMIENTO',
              nombre: item.customName || item.inventory?.nombre_comercial,
              cantidad: item.cantidad,
              isExternal: true,
              costo: itemCost,
              proveedor: itemProvider,
              notas: '(Contrato Principal)',
              originalQuotationItemId: item.id
            });
          }
          pieces.forEach(p => {
            const pieceIsExternal = itemIsExternal || !!p.componentCatalogItem?.isExternal;
            const pieceProvider = itemIsExternal ? itemProvider : (pieceIsExternal ? (p.componentCatalogItem?.vendorName || 'POR DEFINIR') : 'SUN PARTNERS');
            let pieceCost = 0;
            if (!itemIsExternal) pieceCost = pieceIsExternal ? (p.componentCatalogItem?.vendorCost || 0) : 0;

            exploded.push({
              id: crypto.randomUUID(),
              category: 'EQUIPAMIENTO',
              nombre: p.componentCatalogItem?.nombre_comercial || p.warehouseItem?.nombre || p.nombre || 'Pieza de Set',
              cantidad: (p.quantity || 1) * item.cantidad,
              isExternal: pieceIsExternal,
              costo: pieceCost,
              proveedor: pieceProvider,
              notas: `De: ${item.customName || item.inventory?.nombre_comercial}`,
              originalQuotationItemId: item.id
            });
          });
        }
      } else {
        exploded.push({
          id: crypto.randomUUID(),
          category: 'EQUIPAMIENTO',
          nombre: item.customName || item.inventory?.nombre_comercial,
          cantidad: item.cantidad,
          isExternal: itemIsExternal,
          costo: itemCost,
          proveedor: itemProvider,
          notas: '',
          originalQuotationItemId: item.id
        });
      }
    });
    return exploded;
  };

  const explodeQuotation = (q) => {
    setMateriales(getTheoreticalExplosion(q));
  };

  const getLinkedSubtotal = (rowId) => {
    // Only Sections 1-4 are added separately to the total because they are NOT mirrored into cells
    // Section 5 (Personal) IS mirrored, so its linked subtotal is already in the cells.
    if (rowId === 'tra') return materiales.filter(m => m.category === 'TRANSPORTE').reduce((acc, m) => acc + (parseFloat(m.costo) || 0) * (parseInt(m.cantidad) || 1), 0);
    if (rowId === 'sub') return materiales.filter(m => m.category === 'EQUIPAMIENTO' && m.isExternal).reduce((acc, m) => acc + (parseFloat(m.costo) || 0) * (parseInt(m.cantidad) || 1), 0);
    if (rowId === 'mat') return materiales.filter(m => ['HERRAMIENTAS', 'INSUMOS'].includes(m.category)).reduce((acc, m) => acc + (parseFloat(m.costo) || 0) * (parseInt(m.cantidad) || 1), 0);
    return 0;
  };

  const totalPresupuesto = useMemo(() => {
    // v50.7: Master Algorithm
    // Sum of all linked subtotals (Except Personal because it's mirrored into cells)
    const linkedTotal = getLinkedSubtotal('tra') + getLinkedSubtotal('sub') + getLinkedSubtotal('mat');

    // Sum of all manual entries in the Budget table
    const manualTotal = presupuesto.reduce((acc, row) =>
        acc + (parseFloat(row.montaje) || 0) + (parseFloat(row.evento) || 0) + (parseFloat(row.desmontaje) || 0), 0);

    return linkedTotal + manualTotal;
  }, [materiales, personal, presupuesto]);

  const hasDiscrepancy = useMemo(() => {
    if (!quotation) return false;
    const theoretical = getTheoreticalExplosion(quotation);
    return theoretical.some(t =>
      !materiales.some(e => e.originalQuotationItemId === t.originalQuotationItemId && e.nombre === t.nombre)
    );
  }, [quotation, materiales]);

  const handleSync = () => {
    const theoretical = getTheoreticalExplosion(quotation);
    const current = materiales || [];

    // v52.1: Advanced Sync Logic - Replace ghosts and add missing
    // 1. Keep manual items (those without originalQuotationItemId)
    const manualItems = current.filter(m => !m.originalQuotationItemId);

    // 2. Filter linked items: only keep those that are still in the theoretical explosion
    // and are NOT fallbacks if a real breakdown is now available.
    const validLinkedItems = current.filter(m => {
      if (!m.originalQuotationItemId) return false;
      const tMatch = theoretical.find(t => t.originalQuotationItemId === m.originalQuotationItemId && t.nombre === m.nombre);
      return !!tMatch;
    });

    // 3. Find truly missing items (theoretical items not in validLinkedItems)
    const missingItems = theoretical.filter(t =>
      !validLinkedItems.some(v => v.originalQuotationItemId === t.originalQuotationItemId && v.nombre === t.nombre)
    );

    if (missingItems.length === 0) {
      setUiModal({ isOpen: true, title: 'Sincronización Completa', content: 'No hay nuevos elementos por heredar de la cotización comercial.', type: 'info' });
      return;
    }

    setMateriales([...manualItems, ...validLinkedItems, ...missingItems]);
    setUiModal({
      isOpen: true,
      title: 'Sincronización Exitosa',
      content: `Se han inyectado ${missingItems.length} elementos y eliminado filas obsoletas (fantasmas), respetando tus ajustes manuales.`,
      type: 'success'
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/quotations/${id}/planning`, {
        materiales,
        personal,
        presupuesto,
        cronograma,
        footer
      }, { withCredentials: true });

      setUiModal({ isOpen: true, title: 'Planeación Guardada', content: 'Hoja de ruta y presupuesto operativo actualizados.', type: 'success' });
    } catch (err) {
       setUiModal({ isOpen: true, title: 'Error', content: 'No se pudo persistir la planeación.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addLogisticsItem = (category) => {
    setMateriales([...materiales, {
      id: crypto.randomUUID(),
      category,
      nombre: '',
      cantidad: 1,
      isExternal: true,
      costo: 0,
      proveedor: '',
      notas: '',
      isManual: true
    }]);
  };

  const addPersonnel = () => {
    setPersonal([...personal, {
      id: crypto.randomUUID(),
      cargo: '',
      nombre: '',
      montaje: 0,
      evento: 0,
      desmontaje: 0
    }]);
  };

  const updateList = (list, setList, itemId, field, value) => {
    setList(list.map(i => i.id === itemId ? { ...i, [field]: value } : i));
  };

  const removeList = (list, setList, itemId) => {
    setList(list.filter(i => i.id !== itemId));
  };

  if (loading || !quotation) return <div className="p-20 text-center font-display text-zinc-400">INFLANDO PLANEADOR v50.7...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] font-body text-zinc-900">
      <Modal isOpen={uiModal.isOpen} onClose={() => setUiModal({ ...uiModal, isOpen: false })} title={uiModal.title} type={uiModal.type}>{uiModal.content}</Modal>

      <header className="bg-white border-b border-zinc-200 px-12 py-6 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-6">
              <button onClick={() => navigate(`/cotizaciones/${id}`)} className="size-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <div className="flex items-center gap-3">
                   <h2 className="text-2xl font-black tracking-tighter">Mesa de Trabajo Logística</h2>
                   <span className="px-2 py-1 bg-[#5486A1] text-white text-[10px] font-black rounded tracking-widest uppercase">
                     {quotation.consecutivo ? `SP-${quotation.consecutivo}` : `#Q-${quotation.id.substring(0,6).toUpperCase()}`}
                   </span>
                </div>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">{quotation.nombre_evento} • {quotation.client.razon_social}</p>
              </div>
           </div>
           <div className="flex gap-3">
             <button onClick={() => generatePlannerPDF(quotation, 'ROUTER')} className="bg-white border border-zinc-200 text-zinc-600 px-6 py-3 rounded-lg text-[10px] font-black tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-2">
               <span className="material-symbols-outlined text-[18px]">print</span>
               HOJA DE RUTA
             </button>
             <button onClick={() => generatePlannerPDF(quotation, 'REPORT')} className="bg-white border border-zinc-200 text-zinc-600 px-6 py-3 rounded-lg text-[10px] font-black tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-2">
               <span className="material-symbols-outlined text-[18px]">analytics</span>
               REPORTE OPERATIVO
             </button>
             <button onClick={handleSync} className={`px-8 py-3 rounded-lg text-[10px] font-black tracking-widest shadow-lg transition-all flex items-center gap-2 ml-4 ${hasDiscrepancy ? 'bg-[#FBAE17] text-white animate-pulse shadow-yellow-900/20' : 'bg-[#5486A1] text-white shadow-blue-900/10 hover:opacity-90'}`}>
               <span className="material-symbols-outlined text-[20px]">{hasDiscrepancy ? 'warning' : 'sync'}</span>
               {hasDiscrepancy ? 'ACTUALIZACIÓN DISPONIBLE' : 'SINCRONIZAR DATOS'}
             </button>
             <button onClick={handleSave} disabled={saving} className="bg-zinc-900 text-white px-8 py-3 rounded-lg text-[10px] font-black tracking-widest shadow-lg shadow-zinc-900/10 hover:opacity-90 transition-all flex items-center gap-2">
               <span className="material-symbols-outlined text-[20px]">{saving ? 'refresh' : 'cloud_upload'}</span>
               {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
             </button>
           </div>
        </div>
      </header>

      <main className="p-12 max-w-7xl mx-auto w-full space-y-12 pb-32">

        {/* 1. Inventario asignado al evento */}
        <section className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
           <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between bg-[#5486A1]/[0.02]">
              <h3 className="text-[11px] font-black tracking-[0.2em] text-[#5486A1]">1. INVENTARIO ASIGNADO AL EVENTO</h3>
              <button onClick={() => addLogisticsItem('EQUIPAMIENTO')} className="text-[10px] font-black text-[#5486A1] hover:underline flex items-center gap-1">
                 <span className="material-symbols-outlined text-[16px]">add_circle</span> AÑADIR FILA
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                 <thead className="bg-zinc-50 text-[9px] font-black tracking-widest text-zinc-400 border-b border-zinc-100">
                    <tr>
                       <th className="px-8 py-4">CONCEPTO</th>
                       <th className="px-4 py-4">DESCRIPCIÓN / NOTAS</th>
                       <th className="px-4 py-4 text-center w-[80px]">CANT</th>
                       <th className="px-4 py-4 w-[150px]">PROVEEDOR</th>
                       <th className="px-4 py-4 w-[120px] text-right">COSTO</th>
                       <th className="px-4 py-4 text-center w-[50px]"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-50">
                    {materiales.filter(i => i.category === 'EQUIPAMIENTO').map(item => (
                       <tr key={item.id} className="hover:bg-zinc-50/50">
                          <td className="px-8 py-4 w-[300px]">
                             <input value={item.nombre} onChange={e => updateList(materiales, setMateriales, item.id, 'nombre', e.target.value)} className="w-full bg-transparent font-bold outline-none uppercase" placeholder="Nombre..." />
                          </td>
                          <td className="px-4 py-4">
                             <input value={item.notas || ''} onChange={e => updateList(materiales, setMateriales, item.id, 'notas', e.target.value)} className="w-full bg-transparent text-zinc-500 italic outline-none" placeholder="Notas..." />
                          </td>
                          <td className="px-4 py-4">
                             <input type="number" value={item.cantidad} onChange={e => updateList(materiales, setMateriales, item.id, 'cantidad', parseInt(e.target.value) || 0)} className="w-full text-center bg-zinc-100 rounded p-1 font-black outline-none" />
                          </td>
                          <td className="px-4 py-4">
                             <input value={item.proveedor || ''} onChange={e => updateList(materiales, setMateriales, item.id, 'proveedor', e.target.value)} className="w-full border border-zinc-200 rounded p-1 text-[10px] outline-none" placeholder="Proveedor..." />
                          </td>
                          <td className="px-4 py-4 text-right">
                             <div className="flex items-center justify-end gap-1">
                                <span className="text-zinc-400">$</span>
                                <input type="number" value={item.costo} onChange={e => updateList(materiales, setMateriales, item.id, 'costo', parseFloat(e.target.value) || 0)} className="w-24 text-right border border-zinc-200 rounded p-1 font-black outline-none" />
                             </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                             <button onClick={() => removeList(materiales, setMateriales, item.id)} className="text-zinc-300 hover:text-red-500"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </section>

        {/* BLOQUES DE PREPRODUCCIÓN */}
        <div className="grid grid-cols-1 gap-12">
           {[
             { id: 'HERRAMIENTAS', label: '2. OTRAS HERRAMIENTAS Y EQUIPOS DE PREPRODUCCIÓN' },
             { id: 'INSUMOS', label: '3. MATERIALES E INSUMOS' },
             { id: 'TRANSPORTE', label: '4. TRANSPORTE' }
           ].map(block => (
              <section key={block.id} className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                 <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <h3 className="text-[11px] font-black tracking-[0.2em] text-zinc-500">{block.label}</h3>
                    <button onClick={() => addLogisticsItem(block.id)} className="text-[10px] font-black text-[#5486A1] hover:underline flex items-center gap-1">
                       <span className="material-symbols-outlined text-[16px]">add_circle</span> AÑADIR FILA
                    </button>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                       <thead className="bg-zinc-50 text-[9px] font-black tracking-widest text-zinc-400 border-b border-zinc-100">
                          <tr>
                             <th className="px-8 py-4">DESCRIPCIÓN</th>
                             <th className="px-4 py-4 text-center w-[80px]">CANT</th>
                             <th className="px-4 py-4 w-[200px]">PROVEEDOR</th>
                             <th className="px-4 py-4 w-[150px] text-right">COSTO</th>
                             <th className="px-4 py-4 text-center w-[50px]"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-50">
                          {materiales.filter(i => i.category === block.id).map(item => (
                             <tr key={item.id}>
                                <td className="px-8 py-3"><input value={item.nombre} onChange={e => updateList(materiales, setMateriales, item.id, 'nombre', e.target.value)} className="w-full bg-transparent font-medium outline-none" placeholder="Escribir descripción..." /></td>
                                <td className="px-4 py-3"><input type="number" value={item.cantidad} onChange={e => updateList(materiales, setMateriales, item.id, 'cantidad', parseInt(e.target.value) || 0)} className="w-full text-center outline-none" /></td>
                                <td className="px-4 py-3"><input value={item.proveedor || ''} onChange={e => updateList(materiales, setMateriales, item.id, 'proveedor', e.target.value)} className="w-full border border-zinc-100 rounded p-1 outline-none" /></td>
                                <td className="px-4 py-3 text-right">
                                   <div className="flex items-center justify-end gap-1">
                                      <span className="text-zinc-400">$</span>
                                      <input type="number" value={item.costo} onChange={e => updateList(materiales, setMateriales, item.id, 'costo', parseFloat(e.target.value) || 0)} className="w-24 text-right outline-none" />
                                   </div>
                                </td>
                                <td className="px-4 py-3 text-center"><button onClick={() => removeList(materiales, setMateriales, item.id)} className="text-zinc-300 hover:text-red-500"><span className="material-symbols-outlined text-[16px]">close</span></button></td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </section>
           ))}
        </div>

        {/* 5. Personal asignado al evento */}
        <section className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
           <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between bg-[#FBAE17]/[0.05]">
              <h3 className="text-[11px] font-black tracking-[0.2em] text-[#FBAE17]">5. PERSONAL ASIGNADO AL EVENTO</h3>
              <button onClick={addPersonnel} className="text-[10px] font-black text-[#5486A1] hover:underline flex items-center gap-1">
                 <span className="material-symbols-outlined text-[16px]">person_add</span> AÑADIR PERSONAL
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                 <thead className="bg-zinc-50 text-[9px] font-black tracking-widest text-zinc-400 border-b border-zinc-100">
                    <tr>
                       <th className="px-8 py-4">CARGO / NIVEL</th>
                       <th className="px-4 py-4">DESCRIPCIÓN (NOMBRE)</th>
                       <th className="px-4 py-4 text-right">MONTAJE ($)</th>
                       <th className="px-4 py-4 text-right">EVENTO ($)</th>
                       <th className="px-4 py-4 text-right">DESMONTAJE ($)</th>
                       <th className="px-4 py-4 text-right bg-zinc-100/50">TOTAL ($)</th>
                       <th className="px-4 py-4 text-center w-[50px]"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-50">
                    {personal.map(p => (
                       <tr key={p.id}>
                          <td className="px-8 py-4"><input value={p.cargo} onChange={e => updateList(personal, setPersonal, p.id, 'cargo', e.target.value)} className="w-full bg-transparent font-black outline-none" placeholder="Ej: Logístico..." /></td>
                          <td className="px-4 py-4"><input value={p.nombre} onChange={e => updateList(personal, setPersonal, p.id, 'nombre', e.target.value)} className="w-full bg-transparent outline-none" placeholder="Nombre..." /></td>
                          <td className="px-4 py-4 text-right">$ <input type="number" value={p.montaje} onChange={e => updateList(personal, setPersonal, p.id, 'montaje', parseFloat(e.target.value) || 0)} className="w-20 text-right outline-none" /></td>
                          <td className="px-4 py-4 text-right">$ <input type="number" value={p.evento} onChange={e => updateList(personal, setPersonal, p.id, 'evento', parseFloat(e.target.value) || 0)} className="w-20 text-right outline-none" /></td>
                          <td className="px-4 py-4 text-right">$ <input type="number" value={p.desmontaje} onChange={e => updateList(personal, setPersonal, p.id, 'desmontaje', parseFloat(e.target.value) || 0)} className="w-20 text-right outline-none" /></td>
                          <td className="px-4 py-4 text-right font-black bg-zinc-100/30">$ {((parseFloat(p.montaje) || 0) + (parseFloat(p.evento) || 0) + (parseFloat(p.desmontaje) || 0)).toLocaleString()}</td>
                          <td className="px-4 py-4 text-center"><button onClick={() => removeList(personal, setPersonal, p.id)} className="text-zinc-300 hover:text-red-500"><span className="material-symbols-outlined text-[18px]">close</span></button></td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </section>

        {/* TABLA DE PRESUPUESTO */}
        <section className="bg-white rounded-xl border-2 border-zinc-900 shadow-xl overflow-hidden">
           <div className="px-8 py-6 border-b-2 border-zinc-900 bg-zinc-900 text-white flex justify-between items-center">
              <h3 className="text-[12px] font-black tracking-[0.2em]">PRESUPUESTO</h3>
              <div className="text-right">
                 <p className="text-[9px] font-black opacity-60 tracking-widest">TOTAL PRESUPUESTO</p>
                 <p className="text-2xl font-black">$ {totalPresupuesto.toLocaleString()}</p>
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                 <thead className="bg-zinc-50 text-[9px] font-black tracking-widest text-zinc-400 border-b border-zinc-200">
                    <tr>
                       <th className="px-8 py-4">ÍTEM</th>
                       <th className="px-4 py-4">INDICACIONES</th>
                       <th className="px-4 py-4 text-right">MONTAJE ($)</th>
                       <th className="px-4 py-4 text-right">EVENTO ($)</th>
                       <th className="px-4 py-4 text-right">DESMONTAJE ($)</th>
                       <th className="px-4 py-4 text-right bg-zinc-100/50">TOTAL ($)</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-100">
                    {presupuesto.map(row => {
                       const linkedSubtotal = getLinkedSubtotal(row.id);
                       const manualSum = (parseFloat(row.montaje) || 0) + (parseFloat(row.evento) || 0) + (parseFloat(row.desmontaje) || 0);
                       const rowTotal = linkedSubtotal + manualSum;

                       return (
                          <tr key={row.id}>
                             <td className="px-8 py-4 font-black">
                                {row.concepto}
                                {linkedSubtotal > 0 && (
                                   <div className="text-[8px] text-primary font-black uppercase mt-0.5">Incluye ${linkedSubtotal.toLocaleString()} auto</div>
                                )}
                             </td>
                             <td className="px-4 py-4">
                                <input
                                  value={row.indicaciones}
                                  onChange={e => updateList(presupuesto, setPresupuesto, row.id, 'indicaciones', e.target.value)}
                                  className="w-full bg-transparent text-[11px] italic outline-none"
                                  placeholder="Observaciones..."
                                />
                             </td>
                             <td className="px-4 py-4 text-right">
                                $ <input
                                  type="number"
                                  value={row.montaje}
                                  onChange={e => updateList(presupuesto, setPresupuesto, row.id, 'montaje', parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right outline-none bg-transparent font-bold"
                                />
                             </td>
                             <td className="px-4 py-4 text-right">
                                $ <input
                                  type="number"
                                  value={row.evento}
                                  onChange={e => updateList(presupuesto, setPresupuesto, row.id, 'evento', parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right outline-none bg-transparent font-bold"
                                />
                             </td>
                             <td className="px-4 py-4 text-right">
                                $ <input
                                  type="number"
                                  value={row.desmontaje}
                                  onChange={e => updateList(presupuesto, setPresupuesto, row.id, 'desmontaje', parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right outline-none bg-transparent font-bold"
                                />
                             </td>
                             <td className="px-4 py-4 text-right font-black bg-zinc-100/30">
                                $ {rowTotal.toLocaleString()}
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </section>

        {/* FOOTER DE CONTROL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-zinc-200">
           {['elaboro', 'reviso', 'verifico'].map(field => (
              <div key={field} className="space-y-2">
                 <label className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">{field}</label>
                 <input
                   value={footer[field]}
                   onChange={e => setFooter({ ...footer, [field]: e.target.value })}
                   className="w-full border-b-2 border-zinc-200 py-2 font-bold outline-none focus:border-[#5486A1] transition-all bg-transparent"
                   placeholder="Nombre y Firma..."
                 />
              </div>
           ))}
        </div>

      </main>
    </div>
  );
};

export default Planner;
