import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import 'flatpickr/dist/themes/light.css';

const NewQuotation = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const [activeTab, setActiveTab] = useState(1);
  const [clients, setClients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({
    empresa: '', nit: '', contactoPrincipal: '', cargo: '', direccion: '', ciudad: '', telefono: '', email: ''
  });

  const [formData, setFormData] = useState({
    clientId: '',
    nombre_evento: '',
    tipo_evento: 'Corporativo',
    ubicacion: '',
    fecha_inicio: null,
    fecha_fin: null,
    fecha_montaje_inicio: null,
    fecha_montaje_fin: null,
    fecha_desmontaje_inicio: null,
    fecha_desmontaje_fin: null,
    bitacora: '',
    items: [],
    services: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          axios.get('/api/clients', { withCredentials: true }),
          axios.get('/api/inventory', { withCredentials: true })
        ]);
        setClients(cRes.data);
        setInventory(iRes.data);

        if (isEditing) {
          const qRes = await axios.get(`/api/quotations/${id}`, { withCredentials: true });
          const q = qRes.data;
          setFormData({
            clientId: q.clientId,
            nombre_evento: q.nombre_evento,
            tipo_evento: q.tipo_evento,
            ubicacion: q.ubicacion,
            fecha_inicio: q.fecha_inicio ? new Date(q.fecha_inicio) : null,
            fecha_fin: q.fecha_fin ? new Date(q.fecha_fin) : null,
            fecha_montaje_inicio: q.fecha_montaje_inicio ? new Date(q.fecha_montaje_inicio) : null,
            fecha_montaje_fin: q.fecha_montaje_fin ? new Date(q.fecha_montaje_fin) : null,
            fecha_desmontaje_inicio: q.fecha_desmontaje_inicio ? new Date(q.fecha_desmontaje_inicio) : null,
            fecha_desmontaje_fin: q.fecha_desmontaje_fin ? new Date(q.fecha_desmontaje_fin) : null,
            bitacora: q.bitacora || '',
            items: q.items.map(it => ({
              inventoryId: it.inventoryId,
              cantidad: it.cantidad,
              precio_pactado: it.precio_pactado,
              clase_asignada: it.clase_asignada
            })),
            services: q.services.map(sv => ({
              tipo: sv.tipo,
              descripcion: sv.descripcion,
              cantidad: sv.cantidad,
              precio_pactado: sv.precio_pactado
            }))
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/clients', newClient, { withCredentials: true });
      setClients([...clients, res.data]);
      setFormData({ ...formData, clientId: res.data.id });
      setShowNewClientForm(false);
      setModal({
        isOpen: true,
        title: 'Cliente Registrado',
        content: `La empresa ${res.data.empresa} ha sido creada exitosamente.`,
        type: 'success'
      });
    } catch (err) {
      setModal({ isOpen: true, title: 'Error', content: 'No se pudo crear el cliente corporativo.', type: 'error' });
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { inventoryId: '', cantidad: 1, precio_pactado: 0, clase_asignada: 'A' }]
    });
  };

  const addService = (tipo) => {
    setFormData({
      ...formData,
      services: [...formData.services, { tipo, descripcion: '', cantidad: 1, precio_pactado: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const removeService = (index) => {
    const newServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: newServices });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    if (field === 'inventoryId') {
      const item = inventory.find(i => i.id === value);
      if (item) newItems[index].precio_pactado = item.rentalPrice || (item.vlrUnitario * 0.1);
    }
    setFormData({ ...formData, items: newItems });
  };

  const updateService = (index, field, value) => {
    const newServices = [...formData.services];
    newServices[index][field] = value;
    setFormData({ ...formData, services: newServices });
  };

  const calculateFinancials = () => {
    const subtotalItems = formData.items.reduce((acc, item) => acc + (item.cantidad * item.precio_pactado), 0);
    const subtotalServices = formData.services.reduce((acc, svc) => acc + (svc.cantidad * svc.precio_pactado), 0);
    const subtotal = subtotalItems + subtotalServices;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    return { subtotal, iva, total };
  };

  const { subtotal, iva, total } = calculateFinancials();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required dates
    if (!formData.fecha_inicio || !formData.fecha_fin) {
      setModal({
        isOpen: true,
        title: 'Error de Validación',
        content: 'Error: Faltan fechas obligatorias por completar.',
        type: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await axios.put(`/api/quotations/${id}`, formData, { withCredentials: true });
        navigate(`/cotizaciones/${id}`);
      } else {
        const res = await axios.post('/api/quotations', formData, { withCredentials: true });
        navigate(`/cotizaciones/${res.data.id}`);
      }
    } catch (err) {
      setModal({
        isOpen: true,
        title: 'Error de Validación',
        content: 'Error: Faltan fechas obligatorias por completar o datos inválidos.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 font-body text-zinc-500 text-center mt-20 animate-pulse">Sincronizando con motor Luxury BTL...</div>;

  const TabButton = ({ num, label, icon }) => (
    <div className="flex flex-col items-center flex-1 relative">
      <button
        type="button"
        onClick={() => setActiveTab(num)}
        className={`flex flex-col items-center gap-2 pb-6 pt-4 w-full transition-all group ${
          activeTab === num ? 'text-primary' : 'text-zinc-400 hover:text-zinc-600'
        }`}
      >
        <div className={`size-10 rounded-full border-2 flex items-center justify-center transition-all ${
           activeTab === num ? 'border-primary bg-primary/5' : 'border-zinc-200 group-hover:border-zinc-300'
        }`}>
           <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <span className="font-display font-black uppercase text-[10px] tracking-widest">{label}</span>
      </button>
      {activeTab === num && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(18,174,226,0.3)]"></div>}
    </div>
  );

  const flatpickrConfig = {
    enableTime: true,
    dateFormat: "d/m/Y h:i K",
    time_24hr: false,
    locale: {
      firstDayOfWeek: 1,
      weekdays: {
        shorthand: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
        longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
      },
      months: {
        shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      },
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-body bg-[#FAFAFA] min-h-screen">
      <style>{`
        .flatpickr-calendar {
          border-radius: 2px !important;
          border: 1px solid #e4e4e7 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          z-index: 9999 !important;
        }
        .flatpickr-day.selected {
          background: #12aee2 !important;
          border-color: #12aee2 !important;
        }
        .flatpickr-day:hover {
          background: #f4f4f5 !important;
        }
      `}</style>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        type={modal.type}
      >
        {modal.content}
      </Modal>

      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('/cotizaciones')}
            className="size-10 flex items-center justify-center rounded border border-zinc-200 text-zinc-400 hover:text-zinc-900 transition-colors bg-white shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <h2 className="font-display text-3xl font-black tracking-tight text-zinc-900 uppercase">
              {isEditing ? `Editando: ${formData.nombre_evento}` : (formData.nombre_evento || 'Constructor de Cotizaciones')}
            </h2>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
              {isEditing ? 'Modo de Edición • Actualización de Propuesta' : 'Constructor Maestro • Estándar Premium'}
            </p>
          </div>
        </div>
        <div className="bg-zinc-900 text-white px-6 py-2.5 rounded-sm flex flex-col items-end shadow-xl">
           <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Total Estimado (IVA Inc.)</span>
           <span className="text-xl font-black tracking-tighter text-primary">${total.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded shadow-sm overflow-hidden mb-8">
        <div className="flex border-b border-zinc-100 bg-zinc-50/30">
          <TabButton num={1} label="01. Cliente Corp" icon="apartment" />
          <TabButton num={2} label="02. Logística" icon="styler" />
          <TabButton num={3} label="03. Inventario" icon="inventory_2" />
          <TabButton num={4} label="04. Formalización" icon="verified_user" />
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          {activeTab === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <div className="flex justify-between items-end gap-6">
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Vincular Cliente Maestro</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                  >
                    <option value="">-- Seleccionar de la Base de Datos --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.empresa} (NIT: {c.nit})</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="h-[48px] px-6 border-2 border-zinc-900 rounded text-[11px] font-black uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all shadow-lg"
                >
                  {showNewClientForm ? 'Cerrar Registro' : '+ Registrar Empresa'}
                </button>
              </div>

              {showNewClientForm && (
                <div className="bg-zinc-50 p-8 rounded border-2 border-zinc-100 space-y-6 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary">Alta de Cliente Corporativo</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {p: 'Razón Social', f: 'empresa'}, {p: 'NIT', f: 'nit'},
                      {p: 'Contacto Principal', f: 'contactoPrincipal'}, {p: 'Cargo', f: 'cargo'},
                      {p: 'Dirección', f: 'direccion'}, {p: 'Ciudad', f: 'ciudad'},
                      {p: 'Teléfono', f: 'telefono'}, {p: 'Email Corp', f: 'email'}
                    ].map(field => (
                      <input
                        key={field.f}
                        type="text"
                        placeholder={field.p}
                        value={newClient[field.f]}
                        onChange={e => setNewClient({...newClient, [field.f]: e.target.value})}
                        className="bg-white border-2 border-zinc-100 text-zinc-900 rounded px-4 py-2.5 text-sm font-medium outline-none focus:border-primary"
                      />
                    ))}
                  </div>
                  <button onClick={handleCreateClient} className="bg-zinc-900 text-white px-8 py-2.5 rounded text-[11px] font-black uppercase tracking-widest hover:bg-primary transition-all">Guardar en Base de Datos</button>
                </div>
              )}

              <div className="pt-8 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Identificador del Proyecto</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Lanzamiento Marca XYZ 2024"
                    value={formData.nombre_evento}
                    onChange={(e) => setFormData({ ...formData, nombre_evento: e.target.value })}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded px-5 py-3.5 text-base font-bold tracking-tight outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Ubicación del Despliegue</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Centro de Convenciones Ágora"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    className="w-full bg-zinc-50 border-2 border-zinc-100 rounded px-5 py-3.5 text-base font-bold outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-400">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  {[
                    { l: 'Fase Evento', start: 'fecha_inicio', end: 'fecha_fin', icon: 'celebration', color: 'text-primary' },
                    { l: 'Fase Montaje', start: 'fecha_montaje_inicio', end: 'fecha_montaje_fin', icon: 'build', color: 'text-zinc-900' },
                    { l: 'Fase Desmontaje', start: 'fecha_desmontaje_inicio', end: 'fecha_desmontaje_fin', icon: 'restart_alt', color: 'text-zinc-900' }
                  ].map((phase, i) => {
                    const startDateKey = phase.start;
                    const endDateKey = phase.end;
                    return (
                      <div key={i} className="space-y-6 p-6 border-2 border-zinc-100 rounded bg-white shadow-sm hover:border-zinc-300 transition-all">
                        <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-3 ${phase.color}`}>
                          <span className="material-symbols-outlined text-[20px]">{phase.icon}</span> {phase.l}
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1.5 tracking-tighter">INICIO</label>
                            <Flatpickr
                              data-enable-time
                              value={formData[startDateKey]}
                              onChange={([date]) => setFormData(prev => ({...prev, [startDateKey]: date}))}
                              options={flatpickrConfig}
                              className="w-full border-2 border-zinc-100 rounded px-4 py-2 text-sm font-bold bg-zinc-50 cursor-pointer outline-none focus:border-primary"
                              placeholder="Seleccionar..."
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1.5 tracking-tighter">FIN</label>
                            <Flatpickr
                              data-enable-time
                              value={formData[endDateKey]}
                              onChange={([date]) => setFormData(prev => ({...prev, [endDateKey]: date}))}
                              options={flatpickrConfig}
                              className="w-full border-2 border-zinc-100 rounded px-4 py-2 text-sm font-bold bg-zinc-50 cursor-pointer outline-none focus:border-primary"
                              placeholder="Seleccionar..."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
               <div>
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 border-l-4 border-primary pl-4">Selección de Activos Luxury</h3>
                   <button type="button" onClick={addItem} className="bg-zinc-900 text-white px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-all">
                     <span className="material-symbols-outlined text-[16px]">add</span> Añadir Equipo
                   </button>
                 </div>
                 <div className="space-y-3">
                   {formData.items.map((item, idx) => {
                     const invItem = inventory.find(i => i.id === item.inventoryId);
                     const isOverStock = invItem && item.cantidad > (invItem.claseA + invItem.claseB);
                     return (
                       <div key={idx} className={`flex gap-4 items-start p-4 rounded border-2 transition-all ${isOverStock ? 'border-brand-alert bg-brand-alert/5' : 'border-zinc-50 bg-zinc-50/30'}`}>
                         <div className="flex-1 min-h-[64px]">
                           <select value={item.inventoryId} onChange={e => updateItem(idx, 'inventoryId', e.target.value)} className="w-full bg-white border-2 border-zinc-100 rounded px-4 py-2 text-sm font-bold outline-none focus:border-primary">
                             <option value="">-- Artículo de Inventario --</option>
                             {inventory.map(i => <option key={i.id} value={i.id}>{i.nombre} (Disponibles A+B: {i.claseA + i.claseB})</option>)}
                           </select>
                           <div className="h-5">
                             {isOverStock && <p className="text-[9px] text-brand-alert font-black mt-1 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">⚠️ Alerta stock: Disponible {(invItem.claseA + invItem.claseB)} | Solicitado {item.cantidad}</p>}
                           </div>
                         </div>
                         <div className="w-24">
                           <label className="block text-[8px] font-black uppercase text-zinc-400 mb-1">CANT.</label>
                           <input type="number" value={item.cantidad} onChange={e => updateItem(idx, 'cantidad', e.target.value)} className="w-full bg-white border-2 border-zinc-100 rounded px-3 py-2 text-sm font-black" />
                         </div>
                         <div className="w-28">
                            <label className="block text-[8px] font-black uppercase text-zinc-400 mb-1">CALIDAD</label>
                            <select value={item.clase_asignada} onChange={e => updateItem(idx, 'clase_asignada', e.target.value)} className="w-full bg-white border-2 border-zinc-100 rounded px-3 py-2 text-xs font-black uppercase">
                              <option value="A">Clase A</option>
                              <option value="B">Clase B</option>
                            </select>
                         </div>
                         <div className="w-40 text-right pt-4">
                           <div className="text-sm font-black text-zinc-900 tracking-tight">$ {(item.cantidad * item.precio_pactado).toLocaleString('es-CO')}</div>
                         </div>
                         <button type="button" onClick={() => removeItem(idx)} className="mt-4 text-zinc-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-[22px]">delete_sweep</span></button>
                       </div>
                     );
                   })}
                 </div>
               </div>

               <div className="pt-8 border-t border-zinc-100 grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 border-l-4 border-zinc-900 pl-4">Servicios & Logística</h3>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => addService('Personal')} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:text-primary transition-all">
                            <span className="material-symbols-outlined text-[16px]">groups</span> + Personal
                        </button>
                        <button type="button" onClick={() => addService('Transporte')} className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:text-primary transition-all">
                            <span className="material-symbols-outlined text-[16px]">local_shipping</span> + Transporte
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                        {formData.services.map((svc, idx) => (
                          <div key={idx} className="flex gap-4 items-center p-4 rounded border-2 border-zinc-50 bg-zinc-50/10">
                            <div className="w-28 bg-zinc-900 text-white text-center py-1.5 rounded-sm text-[9px] font-black uppercase tracking-widest">{svc.tipo}</div>
                            <div className="flex-1">
                              <input type="text" value={svc.descripcion} onChange={e => updateService(idx, 'descripcion', e.target.value)} className="w-full bg-white border border-zinc-200 rounded px-4 py-1.5 text-sm font-bold" placeholder="Descripción del servicio especializado..." />
                            </div>
                            <div className="w-36">
                              <input type="number" value={svc.precio_pactado} onChange={e => updateService(idx, 'precio_pactado', e.target.value)} className="w-full bg-white border border-zinc-200 rounded px-4 py-1.5 text-sm font-black text-right" placeholder="Costo" />
                            </div>
                            <button type="button" onClick={() => removeService(idx)} className="text-zinc-300 hover:text-red-500"><span className="material-symbols-outlined text-[20px]">close</span></button>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900 rounded p-8 flex flex-col gap-6 shadow-2xl">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Resumen Financiero</h4>
                     <div className="space-y-4">
                        <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          <span>Subtotal Neto</span>
                          <span className="text-white">$ {subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          <span>IVA (19.0%)</span>
                          <span className="text-white">$ {iva.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="h-px bg-zinc-800 my-4"></div>
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Total General</span>
                           <span className="text-2xl font-black tracking-tighter text-white whitespace-nowrap">$ {total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-10">
               <div className="bg-zinc-50 border-2 border-zinc-100 rounded p-8">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900 mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">verified</span> Verificación de Proyecto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div className="space-y-4">
                       <p className="font-bold uppercase text-[10px] text-zinc-400 tracking-widest border-b border-zinc-200 pb-2">Datos de Cliente</p>
                       <p className="font-black text-zinc-900 text-lg uppercase">{clients.find(c => c.id === formData.clientId)?.empresa || "Cliente no seleccionado"}</p>
                       <p className="text-zinc-600 font-medium tracking-tight">"{formData.nombre_evento}"</p>
                    </div>
                    <div className="space-y-4">
                       <p className="font-bold uppercase text-[10px] text-zinc-400 tracking-widest border-b border-zinc-200 pb-2">Logística y Ubicación</p>
                       <p className="font-bold text-zinc-900 uppercase flex items-center gap-2">
                         <span className="material-symbols-outlined text-[18px]">place</span> {formData.ubicacion}
                       </p>
                       <p className="text-zinc-600 font-bold uppercase text-xs">Evento: {formData.fecha_inicio ? new Date(formData.fecha_inicio).toLocaleDateString() : 'Pendiente'}</p>
                    </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">Instrucciones de Bitácora Interna</label>
                  <textarea
                    rows="6"
                    value={formData.bitacora}
                    onChange={e => setFormData({...formData, bitacora: e.target.value})}
                    className="w-full bg-white border-2 border-zinc-100 rounded-sm p-6 text-sm font-medium focus:border-zinc-900 transition-all outline-none"
                    placeholder="Detalles para el equipo logístico, requerimientos de personal extra, advertencias de acceso..."
                  ></textarea>
               </div>
            </div>
          )}

          <div className="mt-16 pt-10 border-t-2 border-zinc-50 flex justify-between items-center">
             <div className="flex gap-2">
                {[1,2,3,4].map(n => (
                   <div key={n} className={`size-2 rounded-full transition-all ${activeTab >= n ? 'bg-primary w-6' : 'bg-zinc-200'}`}></div>
                ))}
             </div>
             <div className="flex gap-4">
                {activeTab > 1 && (
                  <button type="button" onClick={() => setActiveTab(activeTab - 1)} className="px-10 py-3.5 rounded border-2 border-zinc-200 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all">Anterior</button>
                )}
                {activeTab < 4 ? (
                  <button type="button" onClick={() => setActiveTab(activeTab + 1)} className="bg-zinc-900 text-white px-12 py-3.5 rounded text-[11px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl">Siguiente Estación</button>
                ) : (
                  <button type="submit" disabled={saving} className="bg-primary text-white px-16 py-3.5 rounded text-[11px] font-black uppercase tracking-widest hover:opacity-90 shadow-2xl disabled:opacity-50 flex items-center gap-3">
                    {saving ? 'Procesando...' : (isEditing ? 'Actualizar Cotización Maestro' : 'Generar Cotización Maestro')}
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                  </button>
                )}
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewQuotation;
