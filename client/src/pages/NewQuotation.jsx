import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import 'flatpickr/dist/themes/light.css';

const ComboBox = ({ label, value, options, onChange }) => {
  const [isManual, setIsManual] = useState(!options.includes(value) && value !== '' && value !== null);

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
      <div className="flex gap-2">
        {!isManual ? (
          <select
            value={value}
            onChange={e => {
              if (e.target.value === 'CUSTOM') {
                setIsManual(true);
                onChange('');
              } else {
                onChange(e.target.value);
              }
            }}
            className="flex-1 border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
          >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            <option value="CUSTOM">[ Personalizado... ]</option>
          </select>
        ) : (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              autoFocus
              value={value}
              onChange={e => onChange(e.target.value)}
              className="flex-1 border-2 border-primary/30 rounded-lg p-3 font-bold bg-white outline-none focus:border-primary transition-all text-xs"
              placeholder="Especificar..."
            />
            <button
              type="button"
              onClick={() => { setIsManual(false); onChange(options[0]); }}
              className="bg-zinc-100 text-zinc-400 p-3 rounded-lg hover:bg-zinc-200 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Isolated Component to prevent any React state sharing
const BlindajeDatePicker = ({ id, label, value, onChange }) => {
  const config = {
    enableTime: true,
    dateFormat: "d/m/Y h:i K",
    time_24hr: false,
    allowInput: true,
    locale: { firstDayOfWeek: 1 },
    static: false
  };

  return (
    <div className="space-y-1">
      <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-tighter">{label}</label>
      <Flatpickr
        id={id}
        name={id}
        value={value}
        onChange={(dates) => {
          if (dates && dates.length > 0) {
            onChange(dates[0]);
          }
        }}
        options={config}
        className="w-full border-2 border-zinc-100 rounded p-2 text-xs font-black bg-white outline-none focus:border-primary transition-all"
        placeholder="Día/Mes/Año --:--"
      />
    </div>
  );
};

const NewQuotation = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(1);
  const [clients, setClients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });

  // 1. Core Metadata State
  const [formData, setFormData] = useState({
    clientId: '',
    // Technical Sheet - Client
    cliente_empresa: '',
    cliente_responsable: '',
    cliente_direccion: '',
    cliente_email: '',
    cliente_telefono: '',
    cliente_ciudad: '',
    // Technical Sheet - Event
    evento_nombre: '',
    evento_venue: '',
    evento_tipo: 'Privado',
    evento_servicio: 'Directo',
    evento_duracion: '',
    pago_metodo: 'Contado',
    // Internal refs
    bitacora: '',
    items: [],
    services: []
  });

  // 2. ABSOLUTELY INDEPENDENT DATE STATES
  const [m_i, setMI] = useState(null);
  const [m_f, setMF] = useState(null);
  const [e_i, setEI] = useState(null);
  const [e_f, setEF] = useState(null);
  const [d_i, setDI] = useState(null);
  const [d_f, setDF] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          axios.get('/api/clients', { withCredentials: true }),
          axios.get('/api/inventory/commercial', { withCredentials: true })
        ]);
        setClients(Array.isArray(cRes.data) ? cRes.data : []);
        setInventory(Array.isArray(iRes.data) ? iRes.data : []);

        if (isEditing) {
          const qRes = await axios.get(`/api/quotations/${id}`, { withCredentials: true });
          const q = qRes.data;
          setFormData({
            clientId: q.clientId,
            cliente_empresa: q.cliente_empresa || '',
            cliente_responsable: q.cliente_responsable || '',
            cliente_direccion: q.cliente_direccion || '',
            cliente_email: q.cliente_email || '',
            cliente_telefono: q.cliente_telefono || '',
            cliente_ciudad: q.cliente_ciudad || '',
            evento_nombre: q.evento_nombre || '',
            evento_venue: q.evento_venue || '',
            evento_tipo: q.evento_tipo || 'Privado',
            evento_servicio: q.evento_servicio || 'Directo',
            evento_duracion: q.evento_duracion || '',
            pago_metodo: q.pago_metodo || 'Contado',
            bitacora: q.bitacora || '',
            items: (q.items || []).map(it => ({
              inventoryId: it.inventoryId,
              cantidad: it.cantidad,
              dias: it.dias,
              precio_pactado: it.precio_pactado,
              precio_dia_adicional: it.precio_dia_adicional,
              clase_asignada: it.clase_asignada
            })),
            services: (q.services || []).map(sv => ({
              tipo: sv.tipo,
              descripcion: sv.descripcion,
              cantidad: sv.cantidad,
              dias: sv.dias,
              precio_pactado: sv.precio_pactado,
              precio_dia_adicional: sv.precio_dia_adicional
            }))
          });
          if (q.montaje_inicio) setMI(new Date(q.montaje_inicio));
          if (q.montaje_fin) setMF(new Date(q.montaje_fin));
          if (q.evento_inicio) setEI(new Date(q.evento_inicio));
          if (q.evento_fin) setEF(new Date(q.evento_fin));
          if (q.desmontaje_inicio) setDI(new Date(q.desmontaje_inicio));
          if (q.desmontaje_fin) setDF(new Date(q.desmontaje_fin));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const financials = useMemo(() => {
    const calculateLineTotal = (item) => {
      const cant = parseInt(item.cantidad || 0);
      const dias = parseInt(item.dias || 1);
      const v1 = parseFloat(item.precio_pactado || 0);
      const vExtra = parseFloat(item.precio_dia_adicional || 0);
      return (cant * v1) + (cant * (Math.max(0, dias - 1)) * vExtra);
    };
    const subtotal = formData.items.reduce((acc, it) => acc + calculateLineTotal(it), 0) +
                     formData.services.reduce((acc, sv) => acc + calculateLineTotal(sv), 0);
    return { subtotal, total: subtotal * 1.19 };
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
        ...formData,
        nombre_evento: formData.evento_nombre || 'Evento sin nombre',
        ubicacion: formData.evento_venue || 'Por definir',
        tipo_evento: formData.evento_tipo || 'Privado',
        montaje_inicio: m_i, montaje_fin: m_f,
        evento_inicio: e_i, evento_fin: e_f,
        desmontaje_inicio: d_i, desmontaje_fin: d_f
    };
    try {
      if (isEditing) {
        await axios.put(`/api/quotations/${id}`, payload, { withCredentials: true });
        navigate(`/cotizaciones/${id}`);
      } else {
        const res = await axios.post('/api/quotations', payload, { withCredentials: true });
        navigate(`/cotizaciones/${res.data.id}`);
      }
    } catch (e) {
      setModal({ isOpen: true, title: 'Error', content: 'Error al guardar', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-display text-zinc-400">CARGANDO...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-body bg-[#F8FAFC] min-h-screen">
      <Modal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} type={modal.type}>{modal.content}</Modal>

      <div className="flex justify-between items-center mb-12 bg-white p-10 rounded-lg shadow-sm border border-zinc-100">
        <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-900">CONSTRUCTOR DE COTIZACIONES</h2>
        <div className="bg-primary/5 border border-primary/20 text-primary px-10 py-4 rounded-lg text-right">
           <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Inversión Total Estimada</p>
           <p className="text-3xl font-black tracking-tighter">$ {financials.total.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden">
        <div className="flex border-b border-zinc-100 bg-zinc-50/30">
          {[
            { n: 1, l: '01. CLIENTE', i: 'apartment' },
            { n: 2, l: '02. LOGÍSTICA', i: 'styler' },
            { n: 3, l: '03. INVENTARIO', i: 'inventory_2' },
            { n: 4, l: '04. CIERRE', i: 'verified_user' }
          ].map(tab => (
            <button
              key={tab.n}
              type="button"
              onClick={() => setActiveTab(tab.n)}
              className={`flex-1 py-8 flex flex-col items-center gap-2 transition-all relative ${activeTab === tab.n ? 'text-primary bg-primary/5' : 'text-zinc-400 hover:bg-zinc-50'}`}
            >
              <span className="material-symbols-outlined text-[24px]">{tab.i}</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.l}</span>
              {activeTab === tab.n && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary"></div>}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          {activeTab === 1 && (
            <div className="space-y-12">
               {/* Card A: Cliente */}
               <div className="bg-white border border-zinc-100 rounded-[12px] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8 border-b border-zinc-50 pb-4">
                     <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[20px] fill">apartment</span>
                     </div>
                     <h3 className="font-black uppercase tracking-widest text-sm text-zinc-900">Tarjeta A: Datos del Cliente</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Selector de Cliente Maestro</label>
                        <select
                          value={formData.clientId}
                          onChange={e => {
                            const c = clients.find(cl => cl.id === e.target.value);
                            setFormData({
                              ...formData,
                              clientId: e.target.value,
                              cliente_empresa: c?.empresa || '',
                              cliente_responsable: c?.contactoPrincipal || '',
                              cliente_direccion: c?.direccion || '',
                              cliente_email: c?.email || '',
                              cliente_telefono: c?.telefono || '',
                              cliente_ciudad: c?.ciudad || ''
                            });
                          }}
                          className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                        >
                           <option value="">Seleccionar Cliente Guardado...</option>
                           {clients.map(c => <option key={c.id} value={c.id}>{c.empresa}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Empresa / Razón Social</label>
                        <input type="text" value={formData.cliente_empresa} onChange={e => setFormData({...formData, cliente_empresa: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Responsable de Cuenta</label>
                        <input type="text" value={formData.cliente_responsable} onChange={e => setFormData({...formData, cliente_responsable: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Dirección Fiscal/Evento</label>
                        <input type="text" value={formData.cliente_direccion} onChange={e => setFormData({...formData, cliente_direccion: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Email Corporativo</label>
                        <input type="email" value={formData.cliente_email} onChange={e => setFormData({...formData, cliente_email: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Teléfono</label>
                           <input type="text" value={formData.cliente_telefono} onChange={e => setFormData({...formData, cliente_telefono: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Ciudad</label>
                           <input type="text" value={formData.cliente_ciudad} onChange={e => setFormData({...formData, cliente_ciudad: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" />
                        </div>
                     </div>
                  </div>
               </div>

               {/* Card B: Evento */}
               <div className="bg-white border border-zinc-100 rounded-[12px] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8 border-b border-zinc-50 pb-4">
                     <div className="size-8 bg-brand-alert/10 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-brand-alert text-[20px] fill">celebration</span>
                     </div>
                     <h3 className="font-black uppercase tracking-widest text-sm text-zinc-900">Tarjeta B: Datos del Evento</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     <div className="lg:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Nombre Oficial del Proyecto</label>
                        <input type="text" value={formData.evento_nombre} onChange={e => setFormData({...formData, evento_nombre: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg p-4 font-black text-lg bg-zinc-50 outline-none focus:border-primary transition-all" placeholder="Ej: LANZAMIENTO SUNBTL 2026" />
                     </div>
                     <div className="lg:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Ubicación Exacta (Venue)</label>
                        <input type="text" value={formData.evento_venue} onChange={e => setFormData({...formData, evento_venue: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg p-4 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-sm" placeholder="Ej: Corferias - Pabellón 4" />
                     </div>

                     <ComboBox
                        label="Tipo de Evento"
                        value={formData.evento_tipo}
                        options={['Privado', 'Público', 'Corporativo', 'Ferial']}
                        onChange={val => setFormData({...formData, evento_tipo: val})}
                     />

                     <ComboBox
                        label="Tipo de Servicio"
                        value={formData.evento_servicio}
                        options={['Directo', 'Producción', 'Subcontrato', 'Alquiler Seco']}
                        onChange={val => setFormData({...formData, evento_servicio: val})}
                     />

                     <ComboBox
                        label="Forma de Pago"
                        value={formData.pago_metodo}
                        options={['Contado', '30 Días', '60 Días', 'Anticipo 70%']}
                        onChange={val => setFormData({...formData, pago_metodo: val})}
                     />

                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Operación (Días/Horas)</label>
                        <input type="text" value={formData.evento_duracion} onChange={e => setFormData({...formData, evento_duracion: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" placeholder="Ej: 3 días / 12h diarias" />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               <div className="p-8 border-2 border-zinc-100 rounded bg-white shadow-sm">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-zinc-400">build</span> FASE MONTAJE
                  </h4>
                  <div className="space-y-6">
                     <BlindajeDatePicker id="m-i" label="Inicio Montaje" value={m_i} onChange={setMI} />
                     <BlindajeDatePicker id="m-f" label="Fin Montaje" value={m_f} onChange={setMF} />
                  </div>
               </div>
               <div className="p-8 border-2 border-zinc-100 rounded bg-white shadow-sm">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined">celebration</span> FASE EVENTO
                  </h4>
                  <div className="space-y-6">
                     <BlindajeDatePicker id="e-i" label="Inicio Evento" value={e_i} onChange={setEI} />
                     <BlindajeDatePicker id="e-f" label="Fin Evento" value={e_f} onChange={setEF} />
                  </div>
               </div>
               <div className="p-8 border-2 border-zinc-100 rounded bg-white shadow-sm">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-zinc-400">restart_alt</span> FASE DESMONTAJE
                  </h4>
                  <div className="space-y-6">
                     <BlindajeDatePicker id="d-i" label="Inicio Desmontaje" value={d_i} onChange={setDI} />
                     <BlindajeDatePicker id="d-f" label="Fin Desmontaje" value={d_f} onChange={setDF} />
                  </div>
               </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-6">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Resumen de Equipamiento y Servicios</h3>
                  <div className="flex gap-2">
                     <button type="button" onClick={() => setFormData(p => ({...p, items: [...p.items, {inventoryId: '', cantidad: 1, dias: 1, precio_pactado: 0, precio_dia_adicional: 0}]}))} className="bg-primary text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase hover:opacity-90 transition-all shadow-md">+ Equipo</button>
                     <button type="button" onClick={() => setFormData(p => ({...p, services: [...p.services, {tipo: 'Transporte', descripcion: '', cantidad: 1, dias: 1, precio_pactado: 0, precio_dia_adicional: 0}]}))} className="bg-white border border-zinc-200 text-zinc-900 px-6 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-zinc-50 transition-all shadow-sm">+ Personal</button>
                  </div>
               </div>
               <div className="border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                     <thead className="bg-zinc-50 text-zinc-900 uppercase font-black tracking-widest border-b border-zinc-200">
                        <tr>
                           <th className="p-6">Ítem / Descripción Técnica</th>
                           <th className="p-6 text-center">Cant</th>
                           <th className="p-6 text-center">Días</th>
                           <th className="p-6 text-right">Vr. 1er Día</th>
                           <th className="p-6 text-right">Vr. Adic</th>
                           <th className="p-6 text-right">Subtotal</th>
                           <th className="p-6 w-10"></th>
                        </tr>
                     </thead>
                     <tbody className="font-bold border-t-4 border-zinc-50">
                        {/* SERVICES SECTION */}
                        {formData.services.map((sv, idx) => {
                           const updateSv = (f, v) => {
                              const n = [...formData.services]; n[idx][f] = v;
                              setFormData({...formData, services: n});
                           };
                           const calculateSvTotal = (item) => {
                             const cant = parseInt(item.cantidad || 0);
                             const dias = parseInt(item.dias || 1);
                             const v1 = parseFloat(item.precio_pactado || 0);
                             const vExtra = parseFloat(item.precio_dia_adicional || 0);
                             return (cant * v1) + (cant * (Math.max(0, dias - 1)) * vExtra);
                           };
                           return (
                              <tr key={`sv-${idx}`} className="border-b border-zinc-50 bg-primary/[0.02]">
                                 <td className="p-4">
                                    <div className="flex gap-2">
                                       <select
                                          value={sv.tipo}
                                          onChange={e => updateSv('tipo', e.target.value)}
                                          className="w-40 p-2 bg-white border border-zinc-200 rounded text-[10px] font-black uppercase outline-none focus:border-primary"
                                       >
                                          <option value="Transporte">Transporte</option>
                                          <option value="Cargue / Descargue">Cargue / Descargue</option>
                                          <option value="Personal">Personal</option>
                                       </select>
                                       <input
                                          type="text"
                                          value={sv.descripcion}
                                          onChange={e => updateSv('descripcion', e.target.value)}
                                          placeholder="Descripción del servicio..."
                                          className="flex-1 p-2 bg-white border border-zinc-200 rounded italic text-zinc-500 font-medium outline-none focus:border-primary text-xs"
                                       />
                                    </div>
                                 </td>
                                 <td className="p-4"><input type="number" value={sv.cantidad} onChange={e => updateSv('cantidad', e.target.value)} className="w-16 text-center bg-transparent outline-none" /></td>
                                 <td className="p-4"><input type="number" value={sv.dias} onChange={e => updateSv('dias', e.target.value)} className="w-16 text-center bg-transparent outline-none" /></td>
                                 <td className="p-4 text-right">$ <input type="number" value={sv.precio_pactado} onChange={e => updateSv('precio_pactado', e.target.value)} className="w-24 text-right bg-transparent outline-none" /></td>
                                 <td className="p-4 text-right">$ <input type="number" value={sv.precio_dia_adicional} onChange={e => updateSv('precio_dia_adicional', e.target.value)} className="w-24 text-right bg-transparent outline-none" /></td>
                                 <td className="p-6 text-right text-primary font-black text-sm">$ {calculateSvTotal(sv).toLocaleString()}</td>
                                 <td className="p-6"><button type="button" onClick={() => setFormData(p => ({...p, services: p.services.filter((_, i) => i !== idx)}))} className="text-zinc-300 hover:text-red-500 transition-colors">×</button></td>
                              </tr>
                           );
                        })}

                        {/* ITEMS SECTION */}
                        {formData.items.map((it, idx) => {
                           const invItem = inventory.find(i => i.id === it.inventoryId);
                           const stockTotal = (invItem?.claseA || 0) + (invItem?.claseB || 0) + (invItem?.claseC || 0);
                           const hasStockWarning = it.cantidad > stockTotal;

                           const update = (f, v) => {
                              const n = [...formData.items]; n[idx][f] = v;
                              if (f === 'inventoryId') {
                                 const item = inventory.find(i => i.id === v);
                                 if (item) { n[idx].precio_pactado = item.valor_alquiler; n[idx].precio_dia_adicional = item.valor_alquiler * 0.5; }
                              }
                              setFormData({...formData, items: n});
                           };
                           const calculateLineTotal = (item) => {
                             const cant = parseInt(item.cantidad || 0);
                             const dias = parseInt(item.dias || 1);
                             const v1 = parseFloat(item.precio_pactado || 0);
                             const vExtra = parseFloat(item.precio_dia_adicional || 0);
                             return (cant * v1) + (cant * (Math.max(0, dias - 1)) * vExtra);
                           };
                           return (
                              <tr key={idx} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                                 <td className="p-4">
                                    <div className="flex items-center gap-2">
                                       <select value={it.inventoryId} onChange={e => update('inventoryId', e.target.value)} className="flex-1 p-2 bg-zinc-50 border border-zinc-100 rounded outline-none focus:border-primary text-xs">
                                          <option value="">Seleccionar Equipo...</option>
                                          {inventory.map(i => <option key={i.id} value={i.id}>{i.nombre_comercial}</option>)}
                                       </select>
                                       {hasStockWarning && (
                                          <div className="group relative">
                                             <span className="material-symbols-outlined text-[#FBAE17] font-black cursor-help">warning</span>
                                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-zinc-900 text-white text-[10px] rounded shadow-xl z-50 text-center">
                                                Atención: Cantidad superior al stock disponible ({stockTotal} und)
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 </td>
                                 <td className="p-4"><input type="number" value={it.cantidad} onChange={e => update('cantidad', e.target.value)} className="w-16 text-center outline-none" /></td>
                                 <td className="p-4"><input type="number" value={it.dias} onChange={e => update('dias', e.target.value)} className="w-16 text-center outline-none" /></td>
                                 <td className="p-4 text-right">$ <input type="number" value={it.precio_pactado} onChange={e => update('precio_pactado', e.target.value)} className="w-24 text-right outline-none" /></td>
                                 <td className="p-4 text-right">$ <input type="number" value={it.precio_dia_adicional} onChange={e => update('precio_dia_adicional', e.target.value)} className="w-24 text-right outline-none" /></td>
                                 <td className="p-6 text-right text-zinc-900 font-black text-sm">$ {calculateLineTotal(it).toLocaleString()}</td>
                                 <td className="p-6"><button type="button" onClick={() => setFormData(p => ({...p, items: p.items.filter((_, i) => i !== idx)}))} className="text-zinc-300 hover:text-red-500 transition-colors">×</button></td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 4 && (
             <div className="py-20 text-center space-y-8">
                <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto border-2 border-primary/20">
                   <span className="material-symbols-outlined text-primary text-4xl font-black">check</span>
                </div>
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter text-zinc-900">Validación Técnica Completa</h3>
                   <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-2">Presione el botón inferior para formalizar la propuesta y generar el link seguro.</p>
                </div>
             </div>
          )}

          <div className="mt-16 flex justify-between items-center border-t border-zinc-100 pt-12">
             <button type="button" onClick={() => setActiveTab(p => Math.max(1, p - 1))} className="px-12 py-4 rounded-lg border border-zinc-200 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all shadow-sm">Regresar</button>
             {activeTab < 4 ? (
                <button type="button" onClick={() => setActiveTab(p => Math.min(4, p + 1))} className="bg-primary text-white px-14 py-4 rounded-lg text-[11px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all">Siguiente Estación</button>
             ) : (
                <button type="submit" disabled={saving} className="bg-primary text-white px-20 py-4 rounded-lg text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all">
                   {saving ? 'Procesando...' : 'Finalizar Propuesta Maestro'}
                </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewQuotation;
