import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Avatar from 'boring-avatars';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';
import NewClientModal from '../components/modals/NewClientModal';
import CompositionModal from '../components/modals/CompositionModal';
import CustomItemModal from '../components/modals/CustomItemModal';
import { calculateLineTotal, calculateTotals } from '../utils/quotationUtils';
import { matchesSearch } from '../utils/formatters';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import 'flatpickr/dist/themes/light.css';

const ComboBox = ({ label, value, options, onChange }) => {
  const [isManual, setIsManual] = useState(!options.includes(value) && value !== '' && value !== null);

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black  tracking-widest text-zinc-400">{label}</label>
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

const SearchableSelect = ({ value, options, onChange, placeholder = "Seleccionar equipo..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const selectedItem = useMemo(() => options.find(opt => opt.id === value), [value, options]);

  const filteredOptions = useMemo(() => {
    return options.filter(opt =>
      matchesSearch(opt.nombre_comercial, debouncedSearch)
    );
  }, [options, debouncedSearch]);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative searchable-select flex-1" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border-2 rounded-lg p-2.5 flex items-center justify-between cursor-pointer transition-all bg-zinc-50 ${isOpen ? 'border-primary shadow-sm bg-white' : 'border-zinc-100 hover:border-zinc-200'}`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`material-symbols-outlined text-[18px] ${selectedItem ? 'text-primary' : 'text-zinc-400'}`}>
            {selectedItem ? 'inventory_2' : 'search'}
          </span>
          <span className={`text-xs font-bold truncate ${selectedItem ? 'text-zinc-900 ' : 'text-zinc-400'}`}>
            {selectedItem ? selectedItem.nombre_comercial : placeholder}
          </span>
        </div>
        <span className={`material-symbols-outlined text-zinc-400 text-[18px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: `${coords.top + 8}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
          }}
          className="bg-white border-2 border-primary/20 rounded-[12px] shadow-2xl z-[200] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="p-3 border-b border-zinc-100 bg-zinc-50/50">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[16px]">search</span>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-zinc-200 rounded-lg focus:outline-none focus:border-primary transition-all"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-[10px] font-black  tracking-widest">No hay resultados</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-all flex flex-col gap-0.5 hover:bg-zinc-50 ${value === opt.id ? 'bg-primary/5 border border-primary/10' : 'border border-transparent'}`}
                >
                  <span className="text-[11px] font-black text-zinc-900  tracking-tight">{opt.nombre_comercial}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-zinc-400 ">Stock: {opt.claseA + opt.claseB} und</span>
                    <span className="text-[9px] font-black text-primary">$ {opt.valor_alquiler.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

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
      <label className="block text-[9px] font-black  text-zinc-400 tracking-tighter">{label}</label>
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
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(1);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCompositionModalOpen, setIsCompositionModalOpen] = useState(false);
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: '', index: null });
  const [editingComposition, setEditingComposition] = useState(null);
  const [editingCustomItem, setEditingCustomItem] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  // 1. Core Metadata State
  const [formData, setFormData] = useState({
    clientId: '',
    razon_social: '',
    responsable: '',
    direccion_fiscal: '',
    email: '',
    telefono: '',
    ciudad: '',
    // Technical Sheet - Event
    evento_nombre: '',
    evento_venue: '',
    consultantId: '',
    evento_tipo: 'Privado',
    evento_servicio: 'Directo',
    evento_duracion: '',
    pago_metodo: 'Contado',
    // Internal refs
    bitacora: '',
    estado: 'BORRADOR',
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

  const fetchClients = async () => {
    try {
      const res = await axios.get('/api/clients', { withCredentials: true });
      setClients(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, iRes, uRes] = await Promise.all([
          axios.get('/api/clients', { withCredentials: true }),
          axios.get('/api/inventory/commercial', { withCredentials: true }),
          axios.get('/api/users', { withCredentials: true })
        ]);
        setClients(Array.isArray(cRes.data) ? cRes.data : []);
        setInventory(Array.isArray(iRes.data) ? iRes.data : []);
        setUsers(Array.isArray(uRes.data) ? uRes.data : []);

        if (isEditing) {
          const qRes = await axios.get(`/api/quotations/${id}`, { withCredentials: true });
          const q = qRes.data;
          setFormData({
            clientId: q.clientId,
            razon_social: q.client.razon_social || '',
            responsable: q.client.responsable || '',
            direccion_fiscal: q.client.direccion_fiscal || '',
            email: q.client.email || '',
            telefono: q.client.telefono || '',
            ciudad: q.client.ciudad || '',
            evento_nombre: q.nombre_evento || '',
            evento_venue: q.ubicacion || '',
            evento_tipo: q.tipo_evento || 'Privado',
            evento_servicio: q.evento_servicio || 'Directo',
            consultantId: q.consultantId || '',
            evento_duracion: q.evento_duracion || '',
            pago_metodo: q.pago_metodo || 'Contado',
            bitacora: q.bitacora || '',
            estado: q.estado || 'BORRADOR',
            items: (q.items || []).map(it => ({
              inventoryId: it.inventoryId,
              cantidad: it.cantidad,
              dias: it.dias,
              precio_pactado: it.precio_pactado,
              precio_dia_adicional: it.precio_dia_adicional,
              clase_asignada: it.clase_asignada,
              isExternal: it.isExternal,
              isComposition: it.isComposition,
              description: it.description,
              vendorCost: it.vendorCost,
              customName: it.customName,
              compositions: it.compositions,
              inventory: it.inventory
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
          } else {
            // New quotation, default to current user
            setFormData(prev => ({ ...prev, consultantId: currentUser?.id || '' }));
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
    const selectedClient = clients.find(c => c.id === formData.clientId);
    return calculateTotals(formData.items, formData.services, selectedClient?.isTaxExempt || false);
  }, [formData, clients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientId) {
        setModal({ isOpen: true, title: 'Error', content: 'Debe seleccionar o crear un cliente.', type: 'error' });
        return;
    }
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

  const handleClientCreated = async (newClient) => {
    await fetchClients();
    setEditingClient(null);
    setFormData({
      ...formData,
      clientId: newClient.id,
      razon_social: newClient.razon_social,
      responsable: newClient.responsable,
      direccion_fiscal: newClient.direccion_fiscal,
      email: newClient.email,
      telefono: newClient.telefono,
      ciudad: newClient.ciudad
    });
  };

  const handleDelete = () => {
    if (deleteConfirm.type === 'item') {
      const newItems = formData.items.filter((_, i) => i !== deleteConfirm.index);
      setFormData({ ...formData, items: newItems });
    } else {
      const newServices = formData.services.filter((_, i) => i !== deleteConfirm.index);
      setFormData({ ...formData, services: newServices });
    }
    setDeleteConfirm({ isOpen: false, type: '', index: null });
  };

  if (loading) return <div className="p-20 text-center font-display text-zinc-400">CARGANDO...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto font-body bg-[#F8FAFC] min-h-screen">
      <Modal isOpen={modal.isOpen} onClose={() => setModal({ ...modal, isOpen: false })} title={modal.title} type={modal.type}>{modal.content}</Modal>
      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: '', index: null })}
        title="Confirmar eliminación"
        type="warning"
        action={{
          label: 'Eliminar',
          color: 'danger',
          onClick: handleDelete
        }}
      >
        ¿Seguro que quieres eliminar este {deleteConfirm.type === 'item' ? 'ítem' : 'servicio'}?
      </Modal>
      <NewClientModal
        isOpen={isClientModalOpen}
        onClose={() => { setIsClientModalOpen(false); setEditingClient(null); }}
        onClientCreated={handleClientCreated}
        initialData={editingClient}
      />
      <CompositionModal
        isOpen={isCompositionModalOpen}
        onClose={() => {
          setIsCompositionModalOpen(false);
          setEditingComposition(null);
        }}
        initialData={editingComposition?.data}
        onSave={(comp) => {
          if (editingComposition) {
            // Update existing
            const newItems = [...formData.items];
            newItems[editingComposition.index] = {
              ...newItems[editingComposition.index],
              customName: comp.customName,
              description: comp.description,
              isComposition: true,
              precio_pactado: comp.precio_pactado,
              precio_dia_adicional: comp.precio_dia_adicional,
              compositions: comp.items,
              saveToCatalog: comp.saveToCatalog
            };
            setFormData({ ...formData, items: newItems });
          } else {
            // Create new
            setFormData(p => ({
              ...p,
              items: [...p.items, {
                inventoryId: null,
                customName: comp.customName,
                description: comp.description,
                isComposition: true,
                cantidad: 1,
                dias: 1,
                precio_pactado: comp.precio_pactado,
                precio_dia_adicional: comp.precio_dia_adicional,
                clase_asignada: 'A',
                compositions: comp.items,
                saveToCatalog: comp.saveToCatalog
              }]
            }));
          }
        }}
      />
      <CustomItemModal
        isOpen={isCustomItemModalOpen}
        onClose={() => {
          setIsCustomItemModalOpen(false);
          setEditingCustomItem(null);
        }}
        initialData={editingCustomItem?.data}
        onSave={(item) => {
          if (editingCustomItem) {
            const newItems = [...formData.items];
            newItems[editingCustomItem.index] = {
              ...newItems[editingCustomItem.index],
              ...item
            };
            setFormData({ ...formData, items: newItems });
          } else {
            setFormData(p => ({
              ...p,
              items: [...p.items, {
                inventoryId: null,
                clase_asignada: 'A',
                dias: 1,
                precio_dia_adicional: 0,
                ...item
              }]
            }));
          }
        }}
      />

      <div className="flex justify-between items-center mb-12 bg-white p-10 rounded-lg shadow-sm border border-zinc-100">
        <h2 className="text-3xl font-black  tracking-tight text-zinc-900">Constructor de cotizaciones</h2>
        <div className="bg-primary/5 border border-primary/20 text-primary px-10 py-4 rounded-lg text-right">
           <p className="text-[11px] font-black  text-primary tracking-[0.4em]">TOTAL</p>
           <p className="text-3xl font-black tracking-tighter ml-8">$ {financials.total.toLocaleString()}</p>
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
              <span className="text-[10px] font-black  tracking-widest">{tab.l}</span>
              {activeTab === tab.n && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary"></div>}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          {activeTab === 1 && (
            <div className="space-y-12">
               {/* Card A: Cliente */}
               <div className="bg-white border border-zinc-100 rounded-[12px] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8 border-b border-zinc-50 pb-4">
                     <div className="flex items-center gap-3">
                        <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                           <span className="material-symbols-outlined text-primary text-[20px] fill">apartment</span>
                        </div>
                        <h3 className="font-black  tracking-widest text-sm text-zinc-900">Tarjeta A: Datos del cliente</h3>
                     </div>
                     <button
                        type="button"
                        onClick={() => setIsClientModalOpen(true)}
                        className="bg-primary text-white px-6 py-2 rounded-[12px] text-[10px] font-black  tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                     >
                        <span className="material-symbols-outlined text-[16px]">person_add</span>
                        Nuevo Cliente
                     </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div className="md:col-span-2 lg:col-span-1">
                        <div className="flex justify-between mb-2">
                           <label className="block text-[10px] font-black  tracking-widest text-zinc-400">Selector de cliente maestro</label>
                           {formData.clientId && (
                              <button
                                 type="button"
                                 onClick={() => {
                                    const c = clients.find(cl => cl.id === formData.clientId);
                                    if (c) {
                                       setEditingClient(c);
                                       setIsClientModalOpen(true);
                                    }
                                 }}
                                 className="text-primary hover:text-primary-hover flex items-center gap-1 text-[10px] font-black  tracking-widest"
                              >
                                 <span className="material-symbols-outlined text-[14px]">settings_suggest</span>
                                 Editar Maestro
                              </button>
                           )}
                        </div>
                        <select
                          value={formData.clientId}
                          onChange={e => {
                            const c = clients.find(cl => cl.id === e.target.value);
                            setFormData({
                              ...formData,
                              clientId: e.target.value,
                              razon_social: c?.razon_social || '',
                              responsable: c?.responsable || '',
                              direccion_fiscal: c?.direccion_fiscal || '',
                              email: c?.email || '',
                              telefono: c?.telefono || '',
                              ciudad: c?.ciudad || ''
                            });
                          }}
                          className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                        >
                           <option value="">Seleccionar Cliente Guardado...</option>
                           {clients.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Empresa / Razón Social</label>
                        <input
                           type="text"
                           value={formData.razon_social}
                           onChange={e => setFormData({...formData, razon_social: e.target.value})}
                           className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Responsable de Cuenta</label>
                        <input
                           type="text"
                           value={formData.responsable}
                           onChange={e => setFormData({...formData, responsable: e.target.value})}
                           className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Dirección Fiscal/Evento</label>
                        <input
                           type="text"
                           value={formData.direccion_fiscal}
                           onChange={e => setFormData({...formData, direccion_fiscal: e.target.value})}
                           className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Email Corporativo</label>
                        <input
                           type="email"
                           value={formData.email}
                           onChange={e => setFormData({...formData, email: e.target.value})}
                           className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Teléfono</label>
                           <input
                              type="text"
                              value={formData.telefono}
                              onChange={e => setFormData({...formData, telefono: e.target.value})}
                              className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Ciudad</label>
                           <input
                              type="text"
                              value={formData.ciudad}
                              onChange={e => setFormData({...formData, ciudad: e.target.value})}
                              className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
                           />
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
                     <h3 className="font-black  tracking-widest text-sm text-zinc-900">Tarjeta B: Datos del evento</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     <div className="lg:col-span-2">
                        <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Nombre oficial del proyecto</label>
                        <input type="text" value={formData.evento_nombre} onChange={e => setFormData({...formData, evento_nombre: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg p-4 font-black text-lg bg-zinc-50 outline-none focus:border-primary transition-all" placeholder="Ej: LANZAMIENTO SUNBTL 2026" />
                     </div>

                     <div>
                        <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2">Consultor responsable</label>
                        <div className="relative">
                           <select
                              value={formData.consultantId}
                              onChange={e => setFormData({ ...formData, consultantId: e.target.value })}
                              className="w-full border-2 border-zinc-100 rounded-lg p-3 pl-12 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs appearance-none"
                           >
                              {users.map(u => (
                                 <option key={u.id} value={u.id}>{u.nombre}</option>
                              ))}
                           </select>
                           <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                              <Avatar
                                 size={24}
                                 name={users.find(u => u.id === formData.consultantId)?.nombre || 'S'}
                                 variant="beam"
                                 colors={['#5486A1', '#FBAE17', '#2D4A5A', '#E5E7EB']}
                              />
                           </div>
                           <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">expand_more</span>
                        </div>
                     </div>
                     <div className="lg:col-span-2">
                        <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Ubicación Exacta (Venue)</label>
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
                        <label className="block text-[10px] font-black  tracking-widest text-zinc-400 mb-2">Operación (Días/Horas)</label>
                        <input type="text" value={formData.evento_duracion} onChange={e => setFormData({...formData, evento_duracion: e.target.value})} className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs" placeholder="Ej: 3 días / 12h diarias" />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               <div className="p-8 border-2 border-zinc-100 rounded bg-white shadow-sm">
                  <h4 className="text-[11px] font-black  tracking-[0.2em] mb-8 flex items-center gap-2">
                    <span className="material-symbols-outlined text-zinc-400">build</span> FASE MONTAJE
                  </h4>
                  <div className="space-y-6">
                     <BlindajeDatePicker id="m-i" label="Inicio Montaje" value={m_i} onChange={setMI} />
                     <BlindajeDatePicker id="m-f" label="Fin Montaje" value={m_f} onChange={setMF} />
                  </div>
               </div>
               <div className="p-8 border-2 border-zinc-100 rounded bg-white shadow-sm">
                  <h4 className="text-[11px] font-black  tracking-[0.2em] mb-8 flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined">celebration</span> FASE EVENTO
                  </h4>
                  <div className="space-y-6">
                     <BlindajeDatePicker id="e-i" label="Inicio Evento" value={e_i} onChange={setEI} />
                     <BlindajeDatePicker id="e-f" label="Fin Evento" value={e_f} onChange={setEF} />
                  </div>
               </div>
               <div className="p-8 border-2 border-zinc-100 rounded bg-white shadow-sm">
                  <h4 className="text-[11px] font-black  tracking-[0.2em] mb-8 flex items-center gap-2">
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
                  <h3 className="text-[11px] font-black  tracking-widest text-zinc-400">Resumen de equipamiento y servicios</h3>
                  <div className="flex gap-2">
                     <button
                        type="button"
                        onClick={() => {
                           setEditingCustomItem(null);
                           setIsCustomItemModalOpen(true);
                        }}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg text-[10px] font-black hover:opacity-90 transition-all shadow-md flex items-center gap-2"
                     >
                        + Externo
                     </button>
                     <button
                        type="button"
                        onClick={() => {
                           setEditingComposition(null);
                           setIsCompositionModalOpen(true);
                        }}
                        className="bg-[#2D4A5A] text-white px-6 py-2 rounded-lg text-[10px] font-black hover:opacity-90 transition-all shadow-md flex items-center gap-2"
                     >
                        + Personalizado
                     </button>
                     <button type="button" onClick={() => setFormData(p => ({...p, items: [...p.items, {inventoryId: '', cantidad: 1, dias: 1, precio_pactado: 0, precio_dia_adicional: 0}]}))} className="bg-primary text-white px-6 py-2 rounded-lg text-[10px] font-black  hover:opacity-90 transition-all shadow-md">+ Equipo</button>
                     <button type="button" onClick={() => setFormData(p => ({...p, services: [...p.services, {tipo: 'Transporte', descripcion: '', cantidad: 1, dias: 1, precio_pactado: 0, precio_dia_adicional: 0}]}))} className="bg-white border border-zinc-200 text-zinc-900 px-6 py-2 rounded-lg text-[10px] font-black  hover:bg-zinc-50 transition-all shadow-sm">+ Personal</button>
                  </div>
               </div>
               <div className="border border-zinc-200 rounded-lg overflow-x-auto shadow-sm custom-scrollbar">
                  <table className="w-full text-left text-xs min-w-[1000px]">
                     <thead className="bg-zinc-50 text-zinc-900  font-black tracking-widest border-b border-zinc-200">
                        <tr>
                           <th className="p-6">Ítem / Servicio</th>
                           <th className="p-6 text-center">Cant</th>
                           <th className="p-6 text-center">Días</th>
                           <th className="p-6 text-right">Vr. 1er Día</th>
                           <th className="p-6 text-right">Vr. Adic</th>
                           <th className="p-6 text-right">Subtotal</th>
                           <th className="p-6 w-[60px] min-w-[60px] text-center">Acción</th>
                        </tr>
                     </thead>
                     <tbody className="font-bold border-t-4 border-zinc-50">
                        {/* SERVICES SECTION */}
                        {formData.services.map((sv, idx) => {
                           const updateSv = (f, v) => {
                              const n = [...formData.services]; n[idx][f] = v;
                              setFormData({...formData, services: n});
                           };
                           return (
                              <tr key={`sv-${idx}`} className="border-b border-zinc-50 bg-primary/[0.02]">
                                 <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                       <div className="flex gap-2">
                                          <select
                                             value={sv.tipo}
                                             onChange={e => updateSv('tipo', e.target.value)}
                                             className="w-40 p-2 bg-white border border-zinc-200 rounded text-[10px] font-black  outline-none focus:border-primary"
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
                                       <div className="px-1">
                                          <span className="text-[9px] text-zinc-400 font-bold ">({sv.cantidad || 0} UNIDADES X {sv.dias || 1} DÍAS)</span>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-4"><input type="number" value={sv.cantidad} onChange={e => updateSv('cantidad', e.target.value)} className="w-16 text-center bg-transparent outline-none" /></td>
                                 <td className="p-4"><input type="number" value={sv.dias} onChange={e => updateSv('dias', e.target.value)} className="w-16 text-center bg-transparent outline-none" /></td>
                                 <td className="p-4 text-right">$ <input type="number" value={sv.precio_pactado} onChange={e => updateSv('precio_pactado', e.target.value)} className="w-24 text-right bg-transparent outline-none" /></td>
                                 <td className="p-4 text-right">$ <input type="number" value={sv.precio_dia_adicional} onChange={e => updateSv('precio_dia_adicional', e.target.value)} className="w-24 text-right bg-transparent outline-none" /></td>
                                 <td className="p-6 text-right text-primary font-black text-sm">$ {calculateLineTotal(sv).toLocaleString()}</td>
                                 <td className="p-6 text-center">
                                    <button
                                       type="button"
                                       onClick={() => setDeleteConfirm({ isOpen: true, type: 'service', index: idx })}
                                       className="text-zinc-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                                       title="Eliminar servicio"
                                    >
                                       <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                 </td>
                              </tr>
                           );
                        })}

                        {/* ITEMS SECTION */}
                        {formData.items.map((it, idx) => {
                           const invItem = inventory.find(i => i.id === it.inventoryId);
                           const stockDisponible = (invItem?.claseA || 0) + (invItem?.claseB || 0);
                           const hasStockWarning = it.inventoryId && it.cantidad > stockDisponible;

                           const update = (f, v) => {
                              const n = [...formData.items]; n[idx][f] = v;
                              if (f === 'inventoryId') {
                                 const item = inventory.find(i => i.id === v);
                                 if (item) {
                                    n[idx].precio_pactado = item.valor_alquiler;
                                    n[idx].precio_dia_adicional = item.valor_alquiler * 0.5;
                                    n[idx].isComposition = item.isComposition;
                                    n[idx].isExternal = item.isExternal;
                                    n[idx].vendorCost = item.vendorCost;
                                    n[idx].inventory = item;
                                    // Generate initial description if it's a catalog composition
                                    if (item.isComposition && item.compositions) {
                                       n[idx].description = `Incluye: ${item.compositions.map(c => `${c.quantity} ${c.componentCatalogItem?.nombre_comercial || c.warehouseItem?.nombre || 'Ítem'}`).join(', ')}`;
                                    }
                                 }
                              }
                              setFormData({...formData, items: n});
                           };
                           return (
                              <tr key={idx} className="border-b border-zinc-50 hover:bg-zinc-50/50">
                                 <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                       <div className="flex items-center gap-2">
                                          {(it.isComposition || it.customName || (it.inventoryId && it.inventory?.compositions?.length > 0)) ? (
                                             <div
                                                onClick={() => {
                                                   if (it.isExternal || it.inventory?.isExternal) {
                                                      setEditingCustomItem({ index: idx, data: it });
                                                      setIsCustomItemModalOpen(true);
                                                   } else {
                                                      setEditingComposition({ index: idx, data: it });
                                                      setIsCompositionModalOpen(true);
                                                   }
                                                }}
                                                className={`flex-1 p-2.5 bg-zinc-50 border-2 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-zinc-100 transition-all ${it.isExternal || it.inventory?.isExternal ? 'border-blue-200' : 'border-primary/20'}`}
                                             >
                                                <span className={`material-symbols-outlined text-[18px] ${it.isExternal || it.inventory?.isExternal ? 'hidden' : 'text-primary'}`}>
                                                   {it.isExternal || it.inventory?.isExternal ? '' : (it.isComposition ? 'auto_awesome' : 'package_2')}
                                                </span>
                                                <span className="text-xs font-black text-zinc-900 uppercase">
                                                   {it.customName || it.inventory?.nombre_comercial || invItem?.nombre_comercial}
                                                   {(it.isExternal || it.inventory?.isExternal) && (
                                                      <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-500 text-[8px] font-black rounded border border-blue-100">EXT</span>
                                                   )}
                                                </span>
                                                <span className="material-symbols-outlined text-[14px] text-zinc-300 ml-auto">edit</span>
                                             </div>
                                          ) : (
                                             <div className="flex-1 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[18px] text-zinc-400">package_2</span>
                                                <SearchableSelect
                                                   value={it.inventoryId}
                                                   options={inventory}
                                                   onChange={val => update('inventoryId', val)}
                                                />
                                             </div>
                                          )}
                                          {hasStockWarning && (
                                             <div className="group relative">
                                                <span className="material-symbols-outlined text-[#FBAE17] font-black cursor-help">warning</span>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-zinc-900 text-white text-[10px] rounded-lg shadow-xl z-50 text-center">
                                                   Stock insuficiente. Disponibles: {stockDisponible}
                                                </div>
                                             </div>
                                          )}
                                       </div>
                                       {(it.inventoryId || it.customName) && (
                                          <div className="px-1 flex flex-col gap-0.5">
                                             <span className="text-[9px] text-zinc-400 font-bold ">({it.cantidad || 0} UNIDADES X {it.dias || 1} DÍAS)</span>
                                             {(it.description || it.compositions?.length > 0) && (
                                                <span className="text-[10px] text-zinc-500 font-medium italic">
                                                   ({it.description || `Incluye: ${it.compositions.map(c => `${c.quantity} ${c.componentCatalogItem?.nombre_comercial || c.warehouseItem?.nombre || c.nombre || 'Ítem no encontrado'}`).join(', ')}`})
                                                </span>
                                             )}
                                          </div>
                                       )}
                                    </div>
                                 </td>
                                 <td className="p-4"><input type="number" value={it.cantidad} onChange={e => update('cantidad', e.target.value)} className="w-16 text-center outline-none" /></td>
                                 <td className="p-4"><input type="number" value={it.dias} onChange={e => update('dias', e.target.value)} className="w-16 text-center outline-none" /></td>
                                 <td className="p-4 text-right">$ <input type="number" value={it.precio_pactado} onChange={e => update('precio_pactado', e.target.value)} className="w-24 text-right outline-none" /></td>
                                 <td className="p-4 text-right">$ <input type="number" value={it.precio_dia_adicional} onChange={e => update('precio_dia_adicional', e.target.value)} className="w-24 text-right outline-none" /></td>
                                 <td className="p-6 text-right text-zinc-900 font-black text-sm">$ {calculateLineTotal(it).toLocaleString()}</td>
                                 <td className="p-6 text-center">
                                    <button
                                       type="button"
                                       onClick={() => setDeleteConfirm({ isOpen: true, type: 'item', index: idx })}
                                       className="text-zinc-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-full"
                                       title="Eliminar ítem"
                                    >
                                       <span className="material-symbols-outlined text-[20px]">delete</span>
                                    </button>
                                 </td>
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
                   <h3 className="text-2xl font-black  tracking-tighter text-zinc-900">Validación Técnica Completa</h3>
                   <p className="text-zinc-500 font-bold text-xs  tracking-widest mt-2">Presione el botón inferior para formalizar la propuesta y generar el link seguro.</p>
                </div>
             </div>
          )}

          <div className="mt-16 flex justify-between items-center border-t border-zinc-100 pt-12">
             <button type="button" onClick={() => setActiveTab(p => Math.max(1, p - 1))} className="px-12 py-4 rounded-lg border border-zinc-200 text-[11px] font-black  tracking-widest hover:bg-zinc-50 transition-all shadow-sm">Regresar</button>
             {activeTab < 4 ? (
                <button type="button" onClick={() => setActiveTab(p => Math.min(4, p + 1))} className="bg-primary text-white px-14 py-4 rounded-lg text-[11px] font-black  tracking-widest hover:opacity-90 shadow-lg shadow-primary/20 transition-all">Siguiente Estación</button>
             ) : (
                <button type="submit" disabled={saving} className="bg-primary text-white px-20 py-4 rounded-lg text-[11px] font-black  tracking-widest shadow-xl shadow-primary/20 hover:opacity-90 transition-all">
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
