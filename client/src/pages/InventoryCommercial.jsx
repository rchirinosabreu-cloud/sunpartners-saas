import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Modal from '../components/ui/Modal';
import CompositionModal from '../components/modals/CompositionModal';
import { matchesSearch } from '../utils/formatters';

const API_URL = '/api';

const InventoryCommercial = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompositionModalOpen, setIsCompositionModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uiModal, setUiModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });

  // Form state
  const [formData, setFormData] = useState({
    nombre_comercial: '',
    valor_alquiler: 0,
    claseA: 0,
    claseB: 0,
    claseC: 0,
    isExternal: false,
    isComposition: false,
    vendorCost: 0,
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
      if (editingItem) {
        await axios.put(`${API_URL}/inventory/commercial/${editingItem.id}`, formData, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/inventory/commercial`, formData, { withCredentials: true });
      }
      setIsModalOpen(false);
      setEditingItem(null);
      fetchItems();
      setUiModal({
        isOpen: true,
        title: 'Operación Exitosa',
        content: editingItem ? 'El catálogo comercial ha sido actualizado.' : 'Nuevo ítem añadido al catálogo comercial.',
        type: 'success'
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      setUiModal({
        isOpen: true,
        title: 'Error de Guardado',
        content: `No se pudo procesar la solicitud: ${errorMsg}`,
        type: 'error'
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    if (item.isComposition) {
      setIsCompositionModalOpen(true);
    } else {
      setFormData({
        nombre_comercial: item.nombre_comercial,
        valor_alquiler: item.valor_alquiler,
        claseA: item.claseA,
        claseB: item.claseB,
        claseC: item.claseC,
        isExternal: item.isExternal || false,
        isComposition: item.isComposition || false,
        vendorCost: item.vendorCost || 0,
        estado: item.estado
      });
      setIsModalOpen(true);
    }
  };

  const handleSaveComposition = async (compData) => {
    try {
      const payload = {
        nombre_comercial: compData.customName,
        valor_alquiler: compData.precio_pactado,
        isComposition: true,
        isExternal: false, // Compositions are usually internal
        compositions: compData.items.map(it => ({
          componentCatalogItemId: it.componentCatalogItemId,
          warehouseItemId: it.warehouseItemId,
          quantity: it.quantity
        }))
      };

      if (editingItem) {
        await axios.put(`${API_URL}/inventory/commercial/${editingItem.id}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/inventory/commercial`, payload, { withCredentials: true });
      }

      fetchItems();
      setUiModal({
        isOpen: true,
        title: 'Operación Exitosa',
        content: editingItem ? 'La composición ha sido actualizada.' : 'Nueva composición añadida al catálogo.',
        type: 'success'
      });
    } catch (error) {
       const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
       setUiModal({
         isOpen: true,
         title: 'Error de Guardado',
         content: `No se pudo procesar la solicitud: ${errorMsg}`,
         type: 'error'
       });
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      nombre_comercial: '',
      valor_alquiler: 0,
      claseA: 0,
      claseB: 0,
      claseC: 0,
      isExternal: true, // Focus on external services from this view
      isComposition: false,
      vendorCost: 0,
      estado: 'ACTIVO'
    });
    setIsModalOpen(true);
  };

  const handleCreateComposition = () => {
    setEditingItem(null);
    setIsCompositionModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio del catálogo?')) return;
    try {
      await axios.post(`${API_URL}/inventory/soft-delete/${id}`, {
        type: 'Commercial',
        justification: 'Eliminado desde el gestor de catálogo comercial.'
      }, { withCredentials: true });
      fetchItems();
      setUiModal({
        isOpen: true,
        title: 'Eliminado',
        content: 'El ítem ha sido removido del catálogo comercial.',
        type: 'success'
      });
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      setUiModal({
        isOpen: true,
        title: 'Error',
        content: `Error al intentar eliminar: ${errorMsg}`,
        type: 'error'
      });
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      matchesSearch(item.nombre_comercial, debouncedSearch) ||
      (item.bodega?.nombre && matchesSearch(item.bodega.nombre, debouncedSearch))
    );
  }, [items, debouncedSearch]);

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
          <h2 className="font-display font-semibold text-2xl tracking-tight text-zinc-900 ">Catálogo Comercial</h2>
          <p className="text-[10px] text-zinc-500 font-bold  tracking-widest">Gestión de Ventas y Precios de Renta</p>
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
          <button
            onClick={handleCreateComposition}
            className="h-9 px-4 bg-[#2D4A5A] text-white text-[11px] font-black tracking-widest rounded shadow-lg shadow-[#2D4A5A]/20 hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            NUEVA COMPOSICIÓN
          </button>
          <button
            onClick={handleCreate}
            className="h-9 px-4 bg-primary text-white text-[11px] font-black tracking-widest rounded shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            NUEVO ÍTEM
          </button>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-auto p-8">
        <div className="w-full border border-zinc-200 rounded overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-4 py-3">Nombre Comercial</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-4 py-3 w-[120px]">Origen</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-4 py-3 w-[180px]">Disponibilidad (A|B)</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-4 py-3 w-[120px]">Estado</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-4 py-3 w-[150px] text-right">Precio Alquiler</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-4 py-3 w-[150px]">Ref. Bodega</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-4 py-3 w-[100px]"></th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-zinc-500 font-body animate-pulse">Cargando catálogo comercial...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-zinc-500 font-body">No hay ítems registrados en el catálogo.</td></tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-zinc-900 tracking-tight">
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-outlined text-[18px] text-zinc-400">
                          {item.isComposition ? 'auto_awesome' : 'package_2'}
                       </span>
                       {item.nombre_comercial}
                       {item.isExternal && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-500 text-[8px] font-black rounded border border-blue-100">EXTERNO</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-sm text-[9px] font-black tracking-widest border ${item.isExternal ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                       {item.isExternal ? 'TERCEROS' : 'BODEGA PROPIA'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                       <span className="px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-700 text-[10px] font-black border border-emerald-200">A: {item.claseA}</span>
                       <span className="px-2 py-0.5 rounded-sm bg-cyan-100 text-cyan-700 text-[10px] font-black border border-cyan-200">B: {item.claseB}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-sm text-[10px] font-black  tracking-widest ${
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
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-zinc-400 hover:text-primary hover:bg-zinc-100 rounded transition-all">
                        <span className="material-symbols-outlined text-[20px]">settings_suggest</span>
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-all">
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CompositionModal
        isOpen={isCompositionModalOpen}
        onClose={() => {
          setIsCompositionModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveComposition}
        initialData={editingItem ? {
          ...editingItem,
          precio_pactado: editingItem.valor_alquiler,
          precio_dia_adicional: editingItem.valor_alquiler * 0.5
        } : null}
        title={editingItem ? "Editar composición maestra" : "Crear composición maestra"}
      />

      {/* Sidebar for Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-[450px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100">
              <h3 className="font-display font-black  text-sm tracking-[0.2em] text-zinc-900">
                Ajuste de Catálogo
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black  tracking-widest text-zinc-400">Nombre Comercial (Embellecido)</label>
                <input required name="nombre_comercial" value={formData.nombre_comercial} onChange={handleInputChange} className="h-11 px-4 border-2 border-zinc-100 rounded-sm focus:border-primary outline-none transition-all font-bold text-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black  tracking-widest text-zinc-400">Precio Renta Sugerido</label>
                    <input required type="number" name="valor_alquiler" value={formData.valor_alquiler} onChange={handleInputChange} className="h-11 px-4 border-2 border-zinc-100 rounded-sm focus:border-primary outline-none text-xl font-black text-primary font-display" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black  tracking-widest text-zinc-400">Costo Base Proveedor</label>
                    <input type="number" name="vendorCost" value={formData.vendorCost} onChange={handleInputChange} className="h-11 px-4 border-2 border-zinc-100 rounded-sm focus:border-primary outline-none text-xl font-black text-zinc-500 font-display bg-zinc-50" />
                  </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded border-2 border-zinc-100">
                  <input
                    type="checkbox"
                    id="isExternalEdit"
                    checked={formData.isExternal}
                    onChange={e => setFormData({...formData, isExternal: e.target.checked})}
                    className="size-5 accent-blue-500 rounded border-zinc-300"
                  />
                  <div>
                      <label htmlFor="isExternalEdit" className="text-[11px] font-black text-zinc-900 uppercase cursor-pointer">Servicio de Terceros (Externo)</label>
                      <p className="text-[9px] font-bold text-zinc-500 italic mt-0.5">Activa este check para servicios que no requieren stock físico de bodega.</p>
                  </div>
              </div>

              {!formData.isExternal && (
                <>
                  <div className="bg-zinc-50 p-6 rounded border-2 border-zinc-100 space-y-4">
                    <h4 className="text-[10px] font-black  tracking-widest text-zinc-500 mb-4 border-b border-zinc-200 pb-2">Estado Operacional (Sincronizado con Bodega)</h4>
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
                    <h4 className="text-[10px] font-black  tracking-widest text-zinc-500">Existencias Disponibles</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-zinc-500 ">Clase A</span>
                          <input type="number" name="claseA" value={formData.claseA} onChange={handleInputChange} className="bg-zinc-800 border-none text-white text-lg font-black px-3 py-1 rounded w-full" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-zinc-500 ">Clase B</span>
                          <input type="number" name="claseB" value={formData.claseB} onChange={handleInputChange} className="bg-zinc-800 border-none text-white text-lg font-black px-3 py-1 rounded w-full" />
                        </div>
                    </div>
                    <p className="text-[9px] text-zinc-500 font-bold italic">* Cualquier cambio en cantidades impactará el stock de Bodega.</p>
                  </div>
                </>
              )}

              <div className="mt-auto flex gap-4 pt-10">
                <button type="submit" className="flex-1 h-12 bg-primary text-white font-black  text-[11px] tracking-widest rounded-sm hover:opacity-90 shadow-xl transition-all">
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
