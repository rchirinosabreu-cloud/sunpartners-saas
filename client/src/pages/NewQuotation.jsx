import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/ui/Modal';

const NewQuotation = () => {
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
    fecha_inicio: '',
    fecha_fin: '',
    fecha_montaje_inicio: '',
    fecha_montaje_fin: '',
    fecha_desmontaje_inicio: '',
    fecha_desmontaje_fin: '',
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      setModal({ isOpen: true, title: 'Error', content: 'No se pudo crear el cliente.', type: 'error' });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post('/api/quotations', formData, { withCredentials: true });
      navigate(`/cotizaciones/${res.data.id}`);
    } catch (err) {
      setModal({
        isOpen: true,
        title: 'Error al Guardar',
        content: err.response?.data?.error || 'Ocurrió un error inesperado al procesar la cotización.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 font-body text-zinc-500 text-center mt-20">Preparando motor de negocio...</div>;

  const TabButton = ({ num, label, icon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(num)}
      className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold text-xs uppercase tracking-widest transition-all ${
        activeTab === num ? 'border-primary text-primary' : 'border-transparent text-zinc-400 hover:text-zinc-600'
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto font-body">
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        type={modal.type}
      >
        {modal.content}
      </Modal>

      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/cotizaciones')}
          className="size-8 flex items-center justify-center rounded border border-zinc-200 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900 uppercase">Constructor de Cotizaciones</h2>
          <p className="text-sm text-zinc-500">Flujo de 4 estaciones para eventos corporativos.</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded shadow-sm overflow-hidden">
        <div className="flex border-b border-zinc-100 bg-zinc-50/50">
          <TabButton num={1} label="Cliente" icon="person" />
          <TabButton num={2} label="Fechas" icon="calendar_today" />
          <TabButton num={3} label="Calculadora" icon="calculate" />
          <TabButton num={4} label="Bitácora" icon="notes" />
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {activeTab === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Seleccionar Cliente</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="">-- Seleccionar cliente existente --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.empresa} ({c.nit})</option>)}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="h-[42px] px-4 border border-zinc-200 rounded text-xs font-bold uppercase hover:bg-zinc-50"
                >
                  {showNewClientForm ? 'Cancelar' : '+ Nuevo Cliente'}
                </button>
              </div>

              {showNewClientForm && (
                <div className="bg-zinc-50 p-6 rounded border border-zinc-200 space-y-4">
                  <h4 className="text-sm font-bold uppercase text-zinc-900">Registro Rápido de Cliente</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Empresa" value={newClient.empresa} onChange={e => setNewClient({...newClient, empresa: e.target.value})} className="bg-white border border-zinc-200 rounded px-3 py-2 text-sm" />
                    <input type="text" placeholder="NIT" value={newClient.nit} onChange={e => setNewClient({...newClient, nit: e.target.value})} className="bg-white border border-zinc-200 rounded px-3 py-2 text-sm" />
                    <input type="text" placeholder="Contacto Principal" value={newClient.contactoPrincipal} onChange={e => setNewClient({...newClient, contactoPrincipal: e.target.value})} className="bg-white border border-zinc-200 rounded px-3 py-2 text-sm" />
                    <input type="text" placeholder="Cargo" value={newClient.cargo} onChange={e => setNewClient({...newClient, cargo: e.target.value})} className="bg-white border border-zinc-200 rounded px-3 py-2 text-sm" />
                    <input type="text" placeholder="Dirección" value={newClient.direccion} onChange={e => setNewClient({...newClient, direccion: e.target.value})} className="bg-white border border-zinc-200 rounded px-3 py-2 text-sm" />
                    <input type="text" placeholder="Ciudad" value={newClient.ciudad} onChange={e => setNewClient({...newClient, ciudad: e.target.value})} className="bg-white border border-zinc-200 rounded px-3 py-2 text-sm" />
                    <input type="text" placeholder="Teléfono" value={newClient.telefono} onChange={e => setNewClient({...newClient, telefono: e.target.value})} className="bg-white border border-zinc-200 rounded px-3 py-2 text-sm" />
                    <input type="email" placeholder="Email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="bg-white border border-zinc-200 rounded px-3 py-2 text-sm" />
                  </div>
                  <button onClick={handleCreateClient} className="bg-zinc-900 text-white px-4 py-2 rounded text-xs font-bold uppercase">Guardar Cliente</button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Nombre del Evento</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Lanzamiento Producto X"
                    value={formData.nombre_evento}
                    onChange={(e) => setFormData({ ...formData, nombre_evento: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-4 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Ubicación / Venue</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: Centro de Convenciones"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded px-4 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="grid grid-cols-3 gap-8">
                  <div className="space-y-4 p-4 border border-zinc-100 rounded bg-zinc-50/30">
                    <h4 className="text-xs font-bold uppercase text-primary flex items-center gap-2">
                       <span className="material-symbols-outlined text-[16px]">celebration</span> Evento
                    </h4>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Desde</label>
                      <input type="datetime-local" value={formData.fecha_inicio} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Hasta</label>
                      <input type="datetime-local" value={formData.fecha_fin} onChange={e => setFormData({...formData, fecha_fin: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border border-zinc-100 rounded">
                    <h4 className="text-xs font-bold uppercase text-zinc-900 flex items-center gap-2">
                       <span className="material-symbols-outlined text-[16px]">build</span> Montaje
                    </h4>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Desde</label>
                      <input type="datetime-local" value={formData.fecha_montaje_inicio} onChange={e => setFormData({...formData, fecha_montaje_inicio: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Hasta</label>
                      <input type="datetime-local" value={formData.fecha_montaje_fin} onChange={e => setFormData({...formData, fecha_montaje_fin: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border border-zinc-100 rounded">
                    <h4 className="text-xs font-bold uppercase text-zinc-900 flex items-center gap-2">
                       <span className="material-symbols-outlined text-[16px]">restart_alt</span> Desmontaje
                    </h4>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Desde</label>
                      <input type="datetime-local" value={formData.fecha_desmontaje_inicio} onChange={e => setFormData({...formData, fecha_desmontaje_inicio: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Hasta</label>
                      <input type="datetime-local" value={formData.fecha_desmontaje_fin} onChange={e => setFormData({...formData, fecha_desmontaje_fin: e.target.value})} className="w-full border border-zinc-200 rounded px-3 py-2 text-sm" />
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div>
                 <div className="flex justify-between mb-4">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Equipos de Inventario</h3>
                   <button type="button" onClick={addItem} className="text-primary text-xs font-bold uppercase flex items-center gap-1 hover:underline">
                     <span className="material-symbols-outlined text-[16px]">add</span> Añadir Equipo
                   </button>
                 </div>
                 <div className="space-y-2">
                   {formData.items.map((item, idx) => {
                     const invItem = inventory.find(i => i.id === item.inventoryId);
                     const isOverStock = invItem && item.cantidad > (invItem.claseA + invItem.claseB);
                     return (
                       <div key={idx} className={`flex gap-3 items-end p-3 rounded border ${isOverStock ? 'border-brand-alert bg-brand-alert/5' : 'border-zinc-100 bg-zinc-50/50'}`}>
                         <div className="flex-1">
                           <select value={item.inventoryId} onChange={e => updateItem(idx, 'inventoryId', e.target.value)} className="w-full bg-white border border-zinc-200 rounded px-3 py-1.5 text-sm">
                             <option value="">-- Artículo --</option>
                             {inventory.map(i => <option key={i.id} value={i.id}>{i.nombre} (Stock: {i.claseA + i.claseB})</option>)}
                           </select>
                           {isOverStock && <p className="text-[10px] text-brand-alert font-bold mt-1 uppercase">⚠️ Stock insuficiente (A+B)</p>}
                         </div>
                         <div className="w-20">
                           <input type="number" value={item.cantidad} onChange={e => updateItem(idx, 'cantidad', e.target.value)} className="w-full bg-white border border-zinc-200 rounded px-3 py-1.5 text-sm" placeholder="Cant" />
                         </div>
                         <div className="w-20">
                            <select value={item.clase_asignada} onChange={e => updateItem(idx, 'clase_asignada', e.target.value)} className="w-full bg-white border border-zinc-200 rounded px-3 py-1.5 text-xs font-bold">
                              <option value="A">A</option>
                              <option value="B">B</option>
                            </select>
                         </div>
                         <div className="w-32">
                           <input type="number" value={item.precio_pactado} onChange={e => updateItem(idx, 'precio_pactado', e.target.value)} className="w-full bg-white border border-zinc-200 rounded px-3 py-1.5 text-sm font-bold" placeholder="Precio" />
                         </div>
                         <button type="button" onClick={() => removeItem(idx)} className="text-zinc-400 hover:text-red-500 p-1.5"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                       </div>
                     );
                   })}
                 </div>
               </div>

               <div className="pt-4 border-t border-zinc-100">
                 <div className="flex justify-between mb-4">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Servicios (Personal & Logística)</h3>
                   <div className="flex gap-4">
                     <button type="button" onClick={() => addService('Personal')} className="text-zinc-600 text-xs font-bold uppercase flex items-center gap-1 hover:text-zinc-900">
                        <span className="material-symbols-outlined text-[16px]">groups</span> + Personal
                     </button>
                     <button type="button" onClick={() => addService('Transporte')} className="text-zinc-600 text-xs font-bold uppercase flex items-center gap-1 hover:text-zinc-900">
                        <span className="material-symbols-outlined text-[16px]">local_shipping</span> + Transporte
                     </button>
                   </div>
                 </div>
                 <div className="space-y-2">
                    {formData.services.map((svc, idx) => (
                      <div key={idx} className="flex gap-3 items-end p-3 rounded border border-zinc-100 bg-zinc-50/50">
                        <div className="w-28 bg-white border border-zinc-200 rounded px-3 py-1.5 text-[10px] font-black uppercase text-zinc-400">{svc.tipo}</div>
                        <div className="flex-1">
                          <input type="text" value={svc.descripcion} onChange={e => updateService(idx, 'descripcion', e.target.value)} className="w-full bg-white border border-zinc-200 rounded px-3 py-1.5 text-sm" placeholder="Descripción del servicio..." />
                        </div>
                        <div className="w-32">
                          <input type="number" value={svc.precio_pactado} onChange={e => updateService(idx, 'precio_pactado', e.target.value)} className="w-full bg-white border border-zinc-200 rounded px-3 py-1.5 text-sm font-bold" placeholder="Precio" />
                        </div>
                        <button type="button" onClick={() => removeService(idx)} className="text-zinc-400 hover:text-red-500 p-1.5"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {activeTab === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Notas Internas y Bitácora</label>
               <textarea
                 rows="8"
                 value={formData.bitacora}
                 onChange={e => setFormData({...formData, bitacora: e.target.value})}
                 className="w-full bg-zinc-50 border border-zinc-200 rounded p-4 text-sm focus:ring-1 focus:ring-primary outline-none"
                 placeholder="Instrucciones especiales para el equipo, detalles de logística, etc."
               ></textarea>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-zinc-100 flex justify-between items-center">
             <div className="text-xs font-bold text-zinc-400 uppercase">
                Paso {activeTab} de 4
             </div>
             <div className="flex gap-4">
                {activeTab > 1 && (
                  <button type="button" onClick={() => setActiveTab(activeTab - 1)} className="px-6 py-3 rounded border border-zinc-200 text-xs font-bold uppercase hover:bg-zinc-50">Anterior</button>
                )}
                {activeTab < 4 ? (
                  <button type="button" onClick={() => setActiveTab(activeTab + 1)} className="bg-zinc-900 text-white px-8 py-3 rounded text-xs font-bold uppercase hover:bg-zinc-800">Siguiente Estación</button>
                ) : (
                  <button type="submit" disabled={saving} className="bg-primary text-white px-8 py-3 rounded text-xs font-bold uppercase hover:opacity-90 shadow-lg disabled:opacity-50">
                    {saving ? 'Guardando...' : 'Crear Cotización Maestro'}
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
