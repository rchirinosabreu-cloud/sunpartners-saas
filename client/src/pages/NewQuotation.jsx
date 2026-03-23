import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NewQuotation = () => {
  const [clients, setClients] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({
    clientId: '',
    nombre_evento: '',
    tipo_evento: 'Corporativo',
    ubicacion: '',
    fecha_inicio: '',
    fecha_fin: '',
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { inventoryId: '', cantidad: 1, precio_pactado: 0, clase_asignada: 'A' }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'inventoryId') {
      const item = inventory.find(i => i.id === value);
      if (item) {
        newItems[index].precio_pactado = item.rentalPrice || (item.vlrUnitario * 0.1);
      }
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post('/api/quotations', formData, { withCredentials: true });
      navigate(`/cotizaciones/${res.data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 font-body text-zinc-500 text-center mt-20">Preparando motor de negocio...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto font-body">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/cotizaciones')}
          className="size-8 flex items-center justify-center rounded border border-zinc-200 text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-900">Nueva Cotización</h2>
          <p className="text-sm text-zinc-500">Configuración inicial del evento.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white border border-zinc-200 rounded p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Cliente</label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Nombre del Evento</label>
              <input
                required
                type="text"
                placeholder="Ej: Boda Familia Perez"
                value={formData.nombre_evento}
                onChange={(e) => setFormData({ ...formData, nombre_evento: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Fecha Inicio</label>
                <input
                  required
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Fecha Fin</label>
                <input
                  required
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded px-4 py-2.5 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Ubicación</label>
              <input
                required
                type="text"
                placeholder="Ej: Hacienda Los Encinos"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded px-4 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-100">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold text-zinc-900 uppercase tracking-wide">Selección de Inventario</h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-primary text-sm font-bold hover:opacity-80 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Añadir Item
              </button>
           </div>

           <div className="space-y-4">
             {formData.items.length === 0 && (
               <div className="p-8 text-center text-zinc-400 italic bg-zinc-50/50 rounded border border-dashed border-zinc-200">
                  Añade artículos para comenzar la cotización.
               </div>
             )}
             {formData.items.map((item, idx) => (
               <div key={idx} className="flex gap-4 items-end bg-zinc-50/50 p-4 rounded border border-zinc-100 group">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Artículo</label>
                    <select
                      required
                      value={item.inventoryId}
                      onChange={(e) => updateItem(idx, 'inventoryId', e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    >
                      <option value="">Seleccionar...</option>
                      {inventory.map(i => (
                        <option key={i.id} value={i.id}>{i.nombre} (Disp: {i.claseA + i.claseB})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Cant.</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => updateItem(idx, 'cantidad', e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Bucket</label>
                    <select
                      value={item.clase_asignada}
                      onChange={(e) => updateItem(idx, 'clase_asignada', e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-xs font-bold uppercase"
                    >
                      <option value="A">Clase A</option>
                      <option value="B">Clase B</option>
                    </select>
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Vlr Unit.</label>
                    <input
                      required
                      type="number"
                      value={item.precio_pactado}
                      onChange={(e) => updateItem(idx, 'precio_pactado', e.target.value)}
                      className="w-full bg-white border border-zinc-200 rounded px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="size-9 flex items-center justify-center text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
               </div>
             ))}
           </div>
        </div>

        <div className="pt-8 border-t border-zinc-100 flex justify-end">
           <button
            type="submit"
            disabled={saving || formData.items.length === 0}
            className="bg-zinc-900 text-white px-8 py-3 rounded text-sm font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {saving ? 'Guardando...' : 'Crear Cotización Maestro'}
           </button>
        </div>
      </form>
    </div>
  );
};

export default NewQuotation;
