import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

const CustomItemModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [precioPactado, setPrecioPactado] = useState(0);
  const [vendorCost, setVendorCost] = useState(0);
  const [vendorName, setVendorName] = useState('');
  const [saveToCatalog, setSaveToCatalog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setNombre(initialData.customName || initialData.nombre_comercial || '');
        setCantidad(initialData.cantidad || 1);
        setPrecioPactado(initialData.precio_pactado || 0);
        setVendorCost(initialData.vendorCost || 0);
        setVendorName(initialData.vendorName || '');
        setSaveToCatalog(false);
      } else {
        setNombre('');
        setCantidad(1);
        setPrecioPactado(0);
        setVendorCost(0);
        setVendorName('');
        setSaveToCatalog(false);
      }
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    if (!nombre || cantidad <= 0) return;
    onSave({
      customName: nombre,
      cantidad,
      precio_pactado: precioPactado,
      vendorCost,
      vendorName,
      isExternal: true,
      saveToCatalog
    });
    onClose();
  };

  const margin = precioPactado - vendorCost;
  const marginPercent = precioPactado > 0 ? (margin / precioPactado) * 100 : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Añadir servicio externo"
      zIndexClass="z-[100]"
      maxWidthClass="max-w-md"
      showFooter={false}
    >
      <div className="space-y-6 my-4">
        <div>
          <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2 uppercase">Nombre del servicio</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-sm"
            placeholder="Ej: Arreglos florales mesa principal"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2 uppercase">Cantidad</label>
                <input
                    type="number"
                    value={cantidad}
                    onChange={e => setCantidad(parseInt(e.target.value) || 0)}
                    className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-sm"
                />
            </div>
            <div>
                <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2 uppercase">Venta Unitario</label>
                <input
                    type="number"
                    value={precioPactado}
                    onChange={e => setPrecioPactado(parseFloat(e.target.value) || 0)}
                    className="w-full border-2 border-zinc-100 rounded-lg p-3 font-black text-primary bg-primary/5 outline-none focus:border-primary transition-all text-sm"
                />
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2 uppercase">Proveedor (Nombre)</label>
              <input
                type="text"
                value={vendorName}
                onChange={e => setVendorName(e.target.value)}
                className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-sm"
                placeholder="Ej: JPL Logística"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black tracking-widest text-zinc-400 mb-2 uppercase">Costo Un.</label>
              <input
                type="number"
                value={vendorCost}
                onChange={e => setVendorCost(parseFloat(e.target.value) || 0)}
                className="w-full border-2 border-zinc-100 rounded-lg p-3 font-bold bg-zinc-50 outline-none focus:border-primary transition-all text-sm"
              />
            </div>
        </div>

        <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-100 flex justify-between items-center">
            <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Margen Estimado</p>
                <p className="text-lg font-black text-zinc-900">${(margin * cantidad).toLocaleString()}</p>
            </div>
            <div className="text-right">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Rentabilidad</p>
                <p className={`text-lg font-black ${marginPercent >= 30 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {marginPercent.toFixed(1)}%
                </p>
            </div>
        </div>

        <div className="flex items-center gap-3 py-2">
           <input
             type="checkbox"
             id="saveToCatalogExternal"
             checked={saveToCatalog}
             onChange={e => setSaveToCatalog(e.target.checked)}
             className="size-4 accent-primary rounded border-zinc-300"
           />
           <label htmlFor="saveToCatalogExternal" className="text-[11px] font-bold text-zinc-600 cursor-pointer">Guardar en catálogo de externos</label>
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
            disabled={!nombre || cantidad <= 0}
            className="flex-[2] py-4 bg-primary text-white rounded-xl text-[11px] font-black tracking-widest uppercase hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            Añadir Servicio
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CustomItemModal;
