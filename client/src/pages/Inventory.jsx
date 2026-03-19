import { useState } from 'react';

const Inventory = () => {
  const [selectedItem, setSelectedItem] = useState(null);

  const items = [
    { id: '#1042', name: 'Sillas Tiffany Blancas', category: 'Mobiliario', total: 500, available: '45/500', status: 'Crítico' },
    { id: '#1043', name: 'Mesas Imperiales 2.4m', category: 'Mobiliario', total: 120, available: '85/120', status: 'Óptimo' },
    { id: '#1044', name: 'Salas Lounge Blancas (Set 4)', category: 'Salas', total: 30, available: '22/30', status: 'Óptimo' },
    { id: '#1045', name: 'Calentadores de Hongo', category: 'Climatización', total: 40, available: '2/40', status: 'Crítico' },
    { id: '#1046', name: 'Carpas Estructurales 10x10', category: 'Estructuras', total: 15, available: '10/15', status: 'Óptimo' },
    { id: '#1047', name: 'Iluminación Wash LED (Barras)', category: 'Iluminación', total: 200, available: '145/200', status: 'Óptimo' },
  ];

  return (
    <main className="flex-1 flex flex-col h-full relative overflow-hidden font-body">
      {/* Header / Action Bar */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-200 bg-background-light shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-display font-semibold text-2xl tracking-tight text-zinc-900">Inventario</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-zinc-400">search</span>
            <input
              className="w-full h-9 pl-9 pr-3 text-[14px] bg-background-light border border-zinc-200 rounded text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-colors"
              placeholder="Buscar artículo..."
              type="text"
            />
          </div>
          <button className="h-9 px-4 bg-primary text-white font-semibold text-[14px] rounded hover:bg-primary-hover transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo Artículo
          </button>
        </div>
      </header>

      {/* Table Area */}
      <div className="flex-1 overflow-auto bg-background-light p-8">
        <div className="w-full border border-zinc-200 rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="font-display font-medium text-[13px] text-zinc-900 px-4 py-3 w-[100px]">ID</th>
                <th className="font-display font-medium text-[13px] text-zinc-900 px-4 py-3">Nombre</th>
                <th className="font-display font-medium text-[13px] text-zinc-900 px-4 py-3 w-[180px]">Categoría</th>
                <th className="font-display font-medium text-[13px] text-zinc-900 px-4 py-3 w-[120px] text-right">Stock Total</th>
                <th className="font-display font-medium text-[13px] text-zinc-900 px-4 py-3 w-[120px] text-right">Disponible</th>
                <th className="font-display font-medium text-[13px] text-zinc-900 px-4 py-3 w-[140px]">Estado</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors group"
                  onClick={() => setSelectedItem(item)}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 group-hover:text-primary transition-colors">{item.id}</td>
                  <td className="px-4 py-3 text-zinc-900 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{item.category}</td>
                  <td className="px-4 py-3 text-zinc-900 text-right font-display text-[15px]">{item.total}</td>
                  <td className={`px-4 py-3 text-right font-display text-[15px] font-medium ${item.status === 'Crítico' ? 'text-brand-alert' : 'text-zinc-900'}`}>
                    {item.available}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium border ${
                      item.status === 'Crítico'
                        ? 'bg-[#fff6e5] text-brand-alert border-[#fdeacc]'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-[13px] text-zinc-500">
          <span>Mostrando 1-6 de 142 artículos</span>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:border-zinc-300 transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:border-zinc-300 transition-colors bg-zinc-50 text-zinc-900 font-medium">1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:border-zinc-300 transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:border-zinc-300 transition-colors">3</button>
            <span className="px-2">...</span>
            <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:border-zinc-300 transition-colors">24</button>
            <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:border-zinc-300 transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Slide-over Panel */}
      {selectedItem && (
        <div className="absolute inset-y-0 right-0 w-[400px] bg-background-light border-l border-zinc-200 flex flex-col z-10 shadow-none">
          {/* Panel Header */}
          <div className="h-16 border-b border-zinc-200 flex items-center justify-between px-6 shrink-0 bg-zinc-50">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-display font-medium text-zinc-500">{selectedItem.id}</span>
              <h3 className="font-display font-semibold text-[16px] text-zinc-900">Detalles del Artículo</h3>
            </div>
            <button
              className="text-zinc-400 hover:text-zinc-900 transition-colors p-1"
              onClick={() => setSelectedItem(null)}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-auto p-6 flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <h2 className="font-display font-semibold text-xl text-zinc-900">{selectedItem.name}</h2>
              <span className="text-[14px] text-zinc-500">Categoría: {selectedItem.category}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-zinc-200 rounded p-4 flex flex-col gap-1 bg-zinc-50">
                <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-wider">Stock Total</span>
                <span className="font-display text-3xl text-zinc-900">{selectedItem.total}</span>
              </div>
              <div className="border border-zinc-200 rounded p-4 flex flex-col gap-1 bg-zinc-50">
                <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-wider">Disponible</span>
                <span className={`font-display text-3xl ${selectedItem.status === 'Crítico' ? 'text-brand-alert' : 'text-zinc-900'}`}>
                  {selectedItem.available.split('/')[0]}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="font-display font-medium text-[15px] text-zinc-900 border-b border-zinc-200 pb-2">Eventos Actuales</h4>
              <div className="flex flex-col gap-3">
                <div className="border border-zinc-200 rounded p-3 text-[14px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-zinc-900">Boda García - López</span>
                    <span className="font-display font-medium text-primary bg-primary/10 px-2 py-0.5 rounded text-[12px]">30 uds</span>
                  </div>
                  <div className="flex items-center gap-4 text-[13px] text-zinc-500">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">calendar_today</span> 12 Nov - 14 Nov</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">location_on</span> Hacienda Los Olivos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-end gap-3 shrink-0">
            <button className="h-9 px-4 bg-background-light border border-zinc-200 text-zinc-900 font-medium text-[14px] rounded hover:bg-zinc-100 transition-colors">
              Editar Stock
            </button>
            <button className="h-9 px-4 bg-zinc-900 text-white font-medium text-[14px] rounded hover:bg-zinc-800 transition-colors">
              Ver Historial
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Inventory;
