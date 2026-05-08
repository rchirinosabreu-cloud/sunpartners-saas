import { useState, useMemo, useEffect } from 'react';
import Modal from '../ui/Modal';
import axios from 'axios';
import { matchesSearch } from '../../utils/formatters';

const CompositionModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [nombre, setNombre] = useState('');
  const [items, setItems] = useState([]);
  const [saveToCatalog, setSaveToCatalog] = useState(false);
  const [precio1erDia, setPrecio1erDia] = useState(0);
  const [precioDiaAdic, setPrecioDiaAdic] = useState(0);
  const [catalogInventory, setCatalogInventory] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await axios.get('/api/inventory/commercial', { withCredentials: true });
        setCatalogInventory(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Error fetching catalog inventory:', err);
      }
    };
    if (isOpen) fetchCatalog();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setNombre(initialData.customName || initialData.nombre_comercial || '');
        setPrecio1erDia(initialData.precio_pactado || 0);
        setPrecioDiaAdic(initialData.precio_dia_adicional || 0);

        // Handle items if they are compositions (catalog or dynamic)
        const rawItems = initialData.compositions || initialData.inventory?.compositions || [];
        setItems(rawItems.map(it => {
          const isCatalogComponent = !!it.componentCatalogItemId;
          return {
            warehouseItemId: it.warehouseItemId,
            componentCatalogItemId: it.componentCatalogItemId,
            nombre: it.componentCatalogItem?.nombre_comercial || it.warehouseItem?.nombre || it.nombre || 'Item',
            quantity: it.quantity,
            vlrUnitario: isCatalogComponent ? (it.componentCatalogItem?.valor_alquiler || 0) : (it.warehouseItem?.vlrUnitario || it.vlrUnitario || 0)
          };
        }));
        setSaveToCatalog(false);
      } else {
        // Reset for new creation
        setNombre('');
        setItems([]);
        setPrecio1erDia(0);
        setPrecioDiaAdic(0);
        setSaveToCatalog(false);
        setSearch('');
      }
    }
  }, [isOpen, initialData]);

  const filteredCatalog = useMemo(() => {
    if (!debouncedSearch) return [];
    return catalogInventory
      .filter(item => matchesSearch(item.nombre_comercial, debouncedSearch))
      .slice(0, 20);
  }, [debouncedSearch, catalogInventory]);

  const addItem = (item) => {
    if (items.some(i => i.componentCatalogItemId === item.id)) return;
    setItems([...items, {
      componentCatalogItemId: item.id,
      nombre: item.nombre_comercial,
      quantity: 1,
      vlrUnitario: item.valor_alquiler
    }]);
    setSearch('');
  };

  const removeItem = (id) => {
    setItems(items.filter(i => (i.componentCatalogItemId || i.warehouseItemId) !== id));
  };

  const updateQuantity = (id, q) => {
    setItems(items.map(i => (i.componentCatalogItemId || i.warehouseItemId) === id ? { ...i, quantity: parseInt(q) || 1 } : i));
  };

  const suggestedPrice = useMemo(() => {
    return items.reduce((acc, cur) => acc + (cur.quantity * cur.vlrUnitario), 0);
  }, [items]);

  // Update prices when suggested changes (only if they are 0)
  useEffect(() => {
    if (precio1erDia === 0 && suggestedPrice > 0) {
      setPrecio1erDia(suggestedPrice);
      setPrecioDiaAdic(suggestedPrice * 0.5);
    }
  }, [suggestedPrice]);

  const handleSave = () => {
    if (!nombre || items.length === 0) return;
    onSave({
      customName: nombre,
      items,
      precio_pactado: precio1erDia,
      precio_dia_adicional: precioDiaAdic,
      saveToCatalog
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear composición"
      zIndexClass="z-[100]"
      maxWidthClass="max-w-4xl"
      showFooter={false}
    >
      <div className="space-y-8 my-4">
        <div>
          <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2 uppercase">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-sm"
            placeholder="Ej: Set Lounge Francia-Teca"
          />
        </div>

        <div className="relative">
          <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2 uppercase">Añadir productos del catálogo</label>
          <div className="relative">
             <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">search</span>
             <input
               type="text"
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full pl-10 pr-4 py-3 border-2 border-zinc-100 rounded-lg font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-xs"
               placeholder="Buscar en catálogo..."
             />
          </div>
          {filteredCatalog.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border-2 border-primary/20 rounded-lg shadow-xl z-50 overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
              {filteredCatalog.map(item => (
                <div
                  key={item.id}
                  onClick={() => addItem(item)}
                  className="p-3 hover:bg-zinc-50 cursor-pointer flex justify-between items-center border-b border-zinc-50 last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-900">{item.nombre_comercial}</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase">Base: ${item.valor_alquiler.toLocaleString()}</span>
                  </div>
                  <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded">Stock: {item.claseA + item.claseB}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
          {items.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed border-zinc-100 rounded-xl">
                <span className="material-symbols-outlined text-zinc-200 text-4xl mb-2">inventory_2</span>
                <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Sin piezas añadidas</p>
             </div>
          ) : (
            items.map(item => (
              <div key={item.componentCatalogItemId || item.warehouseItemId} className="flex items-center gap-4 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                <div className="flex-1">
                  <p className="text-xs font-bold text-zinc-900">{item.nombre}</p>
                  <p className="text-[9px] font-bold text-zinc-400">UNIT: ${item.vlrUnitario?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[9px] font-black text-zinc-400">CANT:</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={e => updateQuantity(item.componentCatalogItemId || item.warehouseItemId, e.target.value)}
                    className="w-12 p-1 text-center font-bold border-2 border-zinc-200 rounded outline-none focus:border-primary text-xs"
                  />
                </div>
                <button onClick={() => removeItem(item.componentCatalogItemId || item.warehouseItemId)} className="text-zinc-300 hover:text-red-500 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
          <div>
            <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2 uppercase">Vr. 1er Día (Sugerido: ${suggestedPrice.toLocaleString()})</label>
            <input
              type="number"
              value={precio1erDia}
              onChange={e => setPrecio1erDia(parseFloat(e.target.value) || 0)}
              className="w-full border-2 border-primary/20 rounded-lg p-3 font-black text-primary bg-primary/5 outline-none focus:border-primary transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2 uppercase">Vr. Día Adicional</label>
            <input
              type="number"
              value={precioDiaAdic}
              onChange={e => setPrecioDiaAdic(parseFloat(e.target.value) || 0)}
              className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 py-2">
           <input
             type="checkbox"
             id="saveToCatalog"
             checked={saveToCatalog}
             onChange={e => setSaveToCatalog(e.target.checked)}
             className="size-4 accent-primary rounded border-zinc-300"
           />
           <label htmlFor="saveToCatalog" className="text-[11px] font-bold text-zinc-600 cursor-pointer">Guardar este ítem en el catálogo comercial</label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 border-2 border-zinc-200 rounded-xl text-[11px] font-black tracking-widest uppercase hover:bg-zinc-50 text-zinc-500 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!nombre || items.length === 0}
            className="flex-[2] py-4 bg-primary text-white rounded-xl text-[11px] font-black tracking-widest uppercase hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            Guardar Composición
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CompositionModal;
