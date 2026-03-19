const Clients = () => {
  const clients = [
    { name: 'Grupo Eventia S.A.', type: 'Corporativo VIP', email: 'marcos@eventia.com', phone: '+52 55 1234 5678', lastEvent: '12 Oct 2023', ltv: '$145,000', status: 'Activo' },
    { name: 'Ana Sofía Robles', type: 'Particular', email: 'ana@gmail.com', phone: '+52 55 9876 5432', lastEvent: '05 Sep 2023', ltv: '$12,500', status: 'Activo' },
    { name: 'Banquetes del Sol', type: 'Pago Pendiente', email: 'sol@banquetes.mx', lastEvent: '28 Ago 2023', ltv: '$89,200', status: 'En Mora' },
    { name: 'Hotel Gran Vía', type: 'Socio Comercial', lastEvent: '15 Jul 2023', ltv: '$210,000', status: 'Inactivo' },
    { name: 'Producciones X', type: 'Agencia', lastEvent: '02 Jun 2023', ltv: '$54,300', status: 'Activo' },
  ];

  return (
    <main className="flex-1 flex flex-col h-full bg-background-light overflow-hidden font-body">
      {/* Header */}
      <header className="h-16 border-b border-zinc-200 flex items-center justify-between px-8 shrink-0 bg-background-light">
        <div className="flex items-center flex-1">
          <h2 className="font-display font-semibold text-[24px] text-zinc-900">Directorio de Clientes</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px]">search</span>
            <input
              className="w-full h-9 pl-9 pr-3 text-sm border border-zinc-200 rounded bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-primary focus:ring-0 transition-colors"
              placeholder="Buscar cliente, email o teléfono..."
              type="text"
            />
          </div>
          <button className="h-9 px-4 bg-primary text-white text-sm font-semibold rounded hover:bg-primary-hover transition-colors flex items-center">
            <span className="material-symbols-outlined text-[18px] mr-1">add</span>
            Nuevo Cliente
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8">
        {/* Table Container */}
        <div className="border border-zinc-200 rounded bg-white overflow-hidden">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-1/4">Cliente / Empresa</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-1/4">Contacto</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-1/6">Último Evento</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-1/6 text-right">Valor Total (LTV)</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-1/12 text-center">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider w-1/12 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-zinc-200">
              {clients.map((client, idx) => (
                <tr key={idx} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">{client.name}</div>
                    <div className={`text-xs mt-0.5 ${client.status === 'En Mora' ? 'text-alert' : 'text-zinc-500'}`}>
                      {client.type}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      {client.email && (
                        <button className="text-zinc-400 hover:text-primary transition-colors flex items-center group/btn" title="Enviar Email">
                          <span className="material-symbols-outlined text-[16px]">mail</span>
                          <span className="ml-1 text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity">{client.email}</span>
                        </button>
                      )}
                      {client.phone && (
                        <button className="text-zinc-400 hover:text-primary transition-colors flex items-center group/btn" title="Llamar">
                          <span className="material-symbols-outlined text-[16px]">call</span>
                          <span className="ml-1 text-xs opacity-0 group-hover/btn:opacity-100 transition-opacity">{client.phone}</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-900">{client.lastEvent}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-display font-medium text-[15px] text-zinc-900">{client.ltv}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                      client.status === 'Activo' ? 'bg-green-50 text-green-700 border-green-200' :
                      client.status === 'En Mora' ? 'bg-orange-50 text-alert border-orange-200' :
                      'bg-zinc-50 text-zinc-500 border-zinc-200'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
          <span>Mostrando 5 de 142 clientes</span>
          <div className="flex space-x-1">
            <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:bg-zinc-50 transition-colors disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-primary bg-primary/10 text-primary font-medium rounded">1</button>
            <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:bg-zinc-50 transition-colors text-zinc-900">2</button>
            <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:bg-zinc-50 transition-colors text-zinc-900">3</button>
            <button className="w-8 h-8 flex items-center justify-center border border-zinc-200 rounded hover:bg-zinc-50 transition-colors text-zinc-900">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Clients;
