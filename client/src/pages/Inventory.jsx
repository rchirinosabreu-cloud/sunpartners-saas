import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Modal from '../components/ui/Modal';
import { matchesSearch } from '../utils/formatters';

const API_URL = '/api';

const BodegaEnum = ['PRINCIPAL', 'AUXILIAR', 'CAPRIELLA', 'SHERYLANDIA'];
const SeccionEnum = [
  'CUARTO_1', 'CUARTO_2', 'CUARTO_3', 'CUARTO_4',
  'SALA', 'OFICINA', 'APTO', 'COCINA',
  'PATIO', 'HERRAMIENTAS', 'GENERAL'
];

const Inventory = () => {
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
  const [editingItem, setEditingItem] = useState(null);
  const [uiModal, setUiModal] = useState({ isOpen: false, title: '', content: '', type: 'info' });

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    claseA: 0,
    claseB: 0,
    claseC: 0,
    bodega: 'PRINCIPAL',
    seccion: 'SALA',
    vlrUnitario: 0,
    observaciones: ''
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/inventory/bodega`, { withCredentials: true });
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
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

  const existenciaTotal = (parseInt(formData.claseA) || 0) + (parseInt(formData.claseB) || 0) + (parseInt(formData.claseC) || 0);
  const vlrTotal = existenciaTotal * (parseFloat(formData.vlrUnitario) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API_URL}/inventory/bodega/${editingItem.id}`, formData, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/inventory/bodega`, formData, { withCredentials: true });
      }
      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
      fetchItems();
      setUiModal({
        isOpen: true,
        title: 'Operación Exitosa',
        content: 'El inventario ha sido actualizado correctamente.',
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
      nombre: item.nombre,
      claseA: item.claseA,
      claseB: item.claseB,
      claseC: item.claseC,
      bodega: item.bodega,
      seccion: item.seccion,
      vlrUnitario: item.vlrUnitario,
      observaciones: item.observaciones || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    // Custom logic for delete confirmation would need a more complex modal or a separate confirm state
    // For now, keeping simple delete with success modal
    if (window.confirm('¿Estás seguro de archivar este artículo?')) {
      try {
        await axios.delete(`${API_URL}/inventory/${id}`, {
          data: { justification: 'Eliminado desde la interfaz' },
          withCredentials: true
        });
        fetchItems();
        setUiModal({
          isOpen: true,
          title: 'Artículo Archivado',
          content: 'El artículo ha sido removido del inventario activo.',
          type: 'success'
        });
      } catch (error) {
        setUiModal({ isOpen: true, title: 'Error', content: 'No se pudo archivar el artículo.', type: 'error' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      claseA: 0,
      claseB: 0,
      claseC: 0,
      bodega: 'PRINCIPAL',
      seccion: 'SALA',
      vlrUnitario: 0,
      observaciones: ''
    });
  };

  const filteredItems = useMemo(() => {
    return items.filter(item =>
      matchesSearch(item.nombre, debouncedSearch) ||
      matchesSearch(item.bodega, debouncedSearch)
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
          <h2 className="font-display font-semibold text-2xl tracking-tight text-zinc-900 ">Inventario de Bodega</h2>
          <p className="text-[10px] text-zinc-500 font-bold  tracking-widest">Control de Activos y Costos Maestros</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400">search</span>
            <input
              className="w-full h-9 pl-9 pr-3 text-[14px] bg-white border border-zinc-200 rounded text-zinc-900 placeholder:text-zinc-400 focus:border-primary transition-colors"
              placeholder="Buscar por nombre o bodega..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { resetForm(); setEditingItem(null); setIsModalOpen(true); }}
            className="h-9 px-4 bg-primary text-white font-medium text-[14px] rounded hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo Artículo
          </button>
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-auto p-8">
        <div className="w-full border border-zinc-200 rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 w-[50px]">ID</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 max-w-[200px]">Nombre</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 w-[160px]">Clase (A|B|C)</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 w-[120px]">Bodega</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 w-[100px]">Sección</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 w-[110px]">Estado Op.</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 w-[100px] text-center">Estado (D/R)</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 w-[100px] text-right">Existencia Total</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 w-[120px] text-right">Vlr. Unitario</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 w-[140px] text-right">Vlr. Total</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 w-[150px]">Observaciones</th>
                <th className="font-display font-medium text-[11px]  text-zinc-500 px-3 py-3 w-[60px]"></th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {loading ? (
                <tr><td colSpan="11" className="p-8 text-center text-zinc-500 font-body animate-pulse">Consultando motor de inventario...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="11" className="p-8 text-center text-zinc-500 font-body">No se encontraron artículos en la base de datos vinculada.</td></tr>
              ) : filteredItems.map((item, index) => (
                <tr key={item.id} className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors">
                  <td className="px-3 py-3 text-zinc-400 font-display text-[11px]">#{index + 1}</td>
                  <td className="px-3 py-3 font-medium text-zinc-900 max-w-[200px] truncate" title={item.nombre}>{item.nombre}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <span title="VIP" className="w-12 inline-flex justify-center py-0.5 text-[10px] font-bold rounded border bg-emerald-50 text-emerald-600 border-emerald-200 text-center">A:{item.claseA}</span>
                      <span title="Operativo" className="w-12 inline-flex justify-center py-0.5 text-[10px] font-bold rounded border bg-[#109CCB] text-white border-[#109CCB] text-center">B:{item.claseB}</span>
                      <span title="Dañado/Taller" className="w-12 inline-flex justify-center py-0.5 text-[10px] font-bold rounded border bg-red-50 text-red-600 border-red-200 text-center">C:{item.claseC}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-zinc-500  text-[11px] font-medium">{item.bodega}</td>
                  <td className="px-3 py-3 text-zinc-500  text-[11px] font-medium">{(item.seccion || 'GENERAL').replace('_', ' ')}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black  tracking-widest ${
                      item.estado === 'ACTIVO' ? 'bg-zinc-900 text-white' :
                      item.estado === 'MANTENIMIENTO' ? 'bg-brand-alert text-black' : 'bg-red-500 text-white'
                    }`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="font-display font-medium text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 text-[12px]">
                      {item.disponibles}/{item.enReparacion}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-display text-[14px]">{item.existenciaTotal}</td>
                  <td className="px-3 py-3 text-right text-zinc-600 font-display">${item.vlrUnitario.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right font-display font-semibold text-zinc-900">${(item.vlrTotal || 0).toLocaleString()}</td>
                  <td className="px-3 py-3 text-zinc-400 text-[12px] truncate max-w-[150px]">{item.observaciones || '-'}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end">
                      <button onClick={() => handleEdit(item)} className="p-1 text-zinc-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1 text-zinc-400 hover:text-brand-alert transition-colors">
                        <span className="material-symbols-outlined text-[18px]">archive</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Sidebar for Create-Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-[450px] bg-white h-full border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-300 shadow-none">
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 bg-zinc-50">
              <h3 className="font-display font-semibold text-lg text-zinc-900">
                {editingItem ? 'Editar Artículo' : 'Nuevo Artículo Maestro'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-zinc-600">Nombre del Artículo *</label>
                <input required name="nombre" value={formData.nombre} onChange={handleInputChange} className="h-9 px-3 border border-zinc-200 rounded focus:border-primary transition-colors" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-zinc-600">Clase A (VIP) *</label>
                  <input required type="number" name="claseA" value={formData.claseA} onChange={handleInputChange} className="h-9 px-3 border border-zinc-200 rounded focus:border-primary font-display" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-zinc-600">Clase B (OP) *</label>
                  <input required type="number" name="claseB" value={formData.claseB} onChange={handleInputChange} className="h-9 px-3 border border-zinc-200 rounded focus:border-primary font-display" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-zinc-600">Clase C (Taller) *</label>
                  <input required type="number" name="claseC" value={formData.claseC} onChange={handleInputChange} className="h-9 px-3 border border-zinc-200 rounded focus:border-primary font-display" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-zinc-600">Estado Operacional *</label>
                  <select name="estado" value={formData.estado} onChange={handleInputChange} className="h-9 px-2 border border-zinc-200 rounded focus:border-primary bg-white  text-[12px] font-bold">
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                    <option value="DANADO">DANADO</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-zinc-600">Bodega *</label>
                  <select name="bodega" value={formData.bodega} onChange={handleInputChange} className="h-9 px-2 border border-zinc-200 rounded focus:border-primary bg-white  text-[12px]">
                    {BodegaEnum.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-medium text-zinc-600">Sección *</label>
                  <select name="seccion" value={formData.seccion} onChange={handleInputChange} className="h-9 px-2 border border-zinc-200 rounded focus:border-primary bg-white  text-[12px]">
                    {SeccionEnum.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-zinc-600">Valor Unitario ($) *</label>
                <input required type="number" name="vlrUnitario" value={formData.vlrUnitario} onChange={handleInputChange} className="h-9 px-3 border border-zinc-200 rounded focus:border-primary font-display" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-zinc-600">Observaciones</label>
                <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} rows="3" className="p-3 border border-zinc-200 rounded focus:border-primary resize-none"></textarea>
              </div>

              {/* Summary Area */}
              <div className="mt-4 p-4 bg-zinc-900 rounded border border-zinc-800 flex flex-col gap-2 shadow-none">
                <div className="flex justify-between text-zinc-400 text-[13px]">
                  <span>Existencia Total:</span>
                  <span className="text-white font-display font-medium">{existenciaTotal} uds</span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span className="text-[14px] font-semibold">Valor Total Calculado:</span>
                  <span className="text-xl font-display font-bold text-primary">${vlrTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-auto flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-10 border border-zinc-200 text-zinc-900 font-medium rounded hover:bg-zinc-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-2 h-10 bg-primary text-white font-semibold rounded hover:bg-primary-hover transition-colors">
                  {editingItem ? 'Actualizar Artículo' : 'Guardar Artículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Inventory;
