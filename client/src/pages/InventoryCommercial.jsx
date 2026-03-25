import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '../components/ui/Modal';

const API_URL = '/api';

const InventoryCommercial = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uiModal, setUiModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });

  // Form state
  const [formData, setFormData] = useState({
    nombre_comercial: '',
    valor_alquiler: 0,
    claseA: 0,
    claseB: 0,
    claseC: 0,
    estado: 'ACTIVO'
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/inventory/commercial`, { withCredentials: true });
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching commercial inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/inventory/commercial/${editingItem.id}`, formData, { withCredentials: true });
      setIsModalOpen(false);
      setEditingItem(null);
      fetchItems();
      setUiModal({
        isOpen: true,
        title: 'Operación Exitosa',
        content: 'El catálogo comercial ha sido actualizado.',
        type: 'success'
      });
    } catch (error) {
      setUiModal({
        isOpen: true,
        title: 'Error de Guardado',
        content: error.response?.data?.error || error.message,
        type: 'error'
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      nombre_comercial: item.nombre_comercial,
      valor_alquiler: item.valor_alquiler,
      claseA: item.claseA,
      claseB: item.claseB,
      claseC: item.claseC,
      estado: item.estado
    });
    setIsModalOpen(true);
  };

  const filteredItems = items.filter(item =>
    item.nombre_comercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.bodega?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="flex-1 flex flex-col h-full relative overflow-hidden font-body bg-white">
      <Modal
        isOpen={uiModal.isOpen}
        onClose={() => setUiModal({ ...uiModal, isOpen: false })}
        title={uiModal.title}
        type={uiModal.type}
      >
        {uiModal.content}
      </Modal>

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-200 shrink-0">
        <div>
          <h2 className="font-display font-semibold text-2xl tracking-tight text-zinc-900 uppercase">Catálogo Comercial</h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Gestión de Ventas y Precios de Renta</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-[300px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400">search</span>
            <input
              className="w-full h-9 pl-9 pr-3 text-[14px] bg-white border border-zinc-200 rounded text-zinc-900 placeholder:text-zinc-400 focus:border-primary transition-colors"
              placeholder="Buscar en el catálogo..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-auto p-8">
        <div className="w-full border border-zinc-200 rounded overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="font-display font-medium text-[11px] uppercase text-zinc-500 px-4 py-3">Nombre Comercial</th>
                <th className="font-display font-medium text-[11px] uppercase text-zinc-500 px-4 py-3 w-[180px]">Disponibilidad (A|B)</th>
                <th className="font-display font-medium text-[11px] uppercase text-zinc-500 px-4 py-3 w-[120px]">Estado</th>
                <th className="font-display font-medium text-[11px] uppercase text-zinc-500 px-4 py-3 w-[150px] text-right">Precio Alquiler</th>
                <th className="font-display font-medium text-[11px] uppercase text-zinc-500 px-4 py-3 w-[150px]">Ref. Bodega</th>
                <th className="font-display font-medium text-[11px] uppercase text-zinc-500 px-4 py-3 w-[60px]"></th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-zinc-500 font-body animate-pulse">Cargando catálogo comercial...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-zinc-500 font-body">No hay ítems registrados en el catálogo.</td></tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-zinc-900 tracking-tight">{item.nombre_comercial}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                       <span className="px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-700 text-[10px] font-black border border-emerald-200">A: {item.claseA}</span>
                       <span className="px-2 py-0.5 rounded-sm bg-cyan-100 text-cyan-700 text-[10px] font-black border border-cyan-200">B: {item.claseB}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest ${
                      item.estado === 'ACTIVO' ? 'bg-zinc-900 text-white' :
                      item.estado === 'MANTENIMIENTO' ? 'bg-brand-alert text-black' : 'bg-red-500 text-white'
                    }`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-display font-black text-primary text-[15px]">
                    ${item.valor_alquiler.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-zinc-400 text-[11px] italic">
                    {item.bodega?.nombre}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button onClick={() => handleEdit(item)} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-zinc-100 rounded transition-all">
                      <span className="material-symbols-outlined text-[20px]">settings_suggest</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sidebar for Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-[450px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100">
              <h3 className="font-display font-black uppercase text-sm tracking-[0.2em] text-zinc-900">
                Ajuste de Catálogo
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nombre Comercial (Embellecido)</label>
                <input required name="nombre_comercial" value={formData.nombre_comercial} onChange={handleInputChange} className="h-11 px-4 border-2 border-zinc-100 rounded-sm focus:border-primary outline-none transition-all font-bold text-lg" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Precio de Renta Sugerido ($)</label>
                <input required type="number" name="valor_alquiler" value={formData.valor_alquiler} onChange={handleInputChange} className="h-11 px-4 border-2 border-zinc-100 rounded-sm focus:border-primary outline-none text-xl font-black text-primary font-display" />
              </div>

              <div className="bg-zinc-50 p-6 rounded border-2 border-zinc-100 space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 border-b border-zinc-200 pb-2">Estado Operacional (Sincronizado con Bodega)</h4>
                 <div className="grid grid-cols-3 gap-2">
                    {['ACTIVO', 'MANTENIMIENTO', 'DANADO'].map(est => (
                       <button
                         key={est}
                         type="button"
                         onClick={() => setFormData({...formData, estado: est})}
                         className={`py-2 text-[10px] font-black rounded-sm border-2 transition-all ${
                           formData.estado === est ? 'bg-zinc-900 border-zinc-900 text-white shadow-lg' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-300'
                         }`}
                       >
                         {est}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="bg-zinc-900 p-6 rounded flex flex-col gap-4 shadow-xl">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Existencias Disponibles</h4>
                 <div className="flex gap-4">
                    <div className="flex-1 flex flex-col gap-1">
                       <span className="text-[9px] font-black text-zinc-500 uppercase">Clase A</span>
                       <input type="number" name="claseA" value={formData.claseA} onChange={handleInputChange} className="bg-zinc-800 border-none text-white text-lg font-black px-3 py-1 rounded" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                       <span className="text-[9px] font-black text-zinc-500 uppercase">Clase B</span>
                       <input type="number" name="claseB" value={formData.claseB} onChange={handleInputChange} className="bg-zinc-800 border-none text-white text-lg font-black px-3 py-1 rounded" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                       <span className="text-[9px] font-black text-zinc-500 uppercase">Clase C</span>
                       <input type="number" name="claseC" value={formData.claseC} onChange={handleInputChange} className="bg-zinc-800 border-none text-white text-lg font-black px-3 py-1 rounded" />
                    </div>
                 </div>
                 <p className="text-[9px] text-zinc-500 font-bold italic">* Cualquier cambio en cantidades impactará el stock de Bodega.</p>
              </div>

              <div className="mt-auto flex gap-4 pt-10">
                <button type="submit" className="flex-1 h-12 bg-primary text-white font-black uppercase text-[11px] tracking-widest rounded-sm hover:opacity-90 shadow-xl transition-all">
                  Guardar Cambios Comerciales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default InventoryCommercial;
