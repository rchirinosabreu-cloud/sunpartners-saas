const MetricCard = ({ label, value, unit, icon, alert = false }) => (
  <div className={`flex h-[120px] flex-col justify-between rounded border p-5 relative overflow-hidden ${
    alert ? 'border-alert bg-background-light' : 'border-zinc-200 bg-background-light'
  }`}>
    {alert && <div className="absolute top-0 left-0 w-1 h-full bg-alert"></div>}
    <div className={`flex items-center justify-between ${alert ? 'pl-1' : ''}`}>
      <span className={`text-[13px] font-medium  tracking-wide ${alert ? 'text-zinc-900' : 'text-zinc-500'}`}>
        {label}
      </span>
      <span className={`material-symbols-outlined text-[20px] ${alert ? 'text-alert' : 'text-zinc-400'}`}>
        {icon}
      </span>
    </div>
    <div className={`flex items-baseline gap-2 ${alert ? 'pl-1' : ''}`}>
      <span className="font-display text-[36px] font-medium leading-none text-zinc-900">{value}</span>
      <span className={`text-xs font-medium ${alert ? 'text-alert' : 'text-zinc-500'}`}>{unit}</span>
    </div>
  </div>
);

const Dashboard = () => {
  const events = [
    { id: 'EV-2041', client: 'Boda Martínez Silva', date: new Date('2026-03-24T09:00:00'), location: 'Hacienda Los Encinos', status: 'Confirmado' },
    { id: 'EV-2042', client: 'Congreso Tech 2024', date: new Date('2026-03-26T07:30:00'), location: 'Centro de Convenciones', status: 'Pendiente' },
    { id: 'EV-2043', client: 'Cena Corporativa ACME', date: new Date('2026-03-26T18:00:00'), location: 'Hotel Plaza Central', status: 'Confirmado' },
    { id: 'EV-2044', client: 'Fiesta de Fin de Año', date: new Date('2026-03-28T20:00:00'), location: 'Salón Cristal', status: 'Borrador' },
  ];

  const formatEventDate = (date) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Eventos Activos" value="12" unit="esta semana" icon="event_available" />
          <MetricCard label="Artículos en Alquiler" value="450" unit="en terreno" icon="chair" />
          <MetricCard label="Entregas Pendientes" value="3" unit="para hoy" icon="local_shipping" />
          <MetricCard label="Alertas de Stock" value="2" unit="requieren atención" icon="warning" alert={true} />
        </div>

        {/* Active Events Table Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-zinc-900">Próximos Eventos</h2>
            <a className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors" href="#">
              Ver todos <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
          <div className="rounded border border-zinc-200 bg-background-light overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-5 py-3 font-medium text-zinc-500 w-24" scope="col">ID</th>
                  <th className="px-5 py-3 font-medium text-zinc-500" scope="col">Cliente</th>
                  <th className="px-5 py-3 font-medium text-zinc-500" scope="col">Fecha</th>
                  <th className="px-5 py-3 font-medium text-zinc-500" scope="col">Ubicación</th>
                  <th className="px-5 py-3 font-medium text-zinc-500" scope="col">Estado</th>
                  <th className="px-5 py-3 font-medium text-zinc-500 text-right" scope="col">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-4 font-display font-medium text-zinc-900">{event.id}</td>
                    <td className="px-5 py-4 text-zinc-900 font-medium">{event.client}</td>
                    <td className="px-5 py-4 text-zinc-500">{formatEventDate(event.date)}</td>
                    <td className="px-5 py-4 text-zinc-500">{event.location}</td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        "inline-flex items-center rounded px-2 py-1 text-xs font-semibold",
                        event.status === 'Confirmado' && "bg-primary/10 text-primary",
                        event.status === 'Pendiente' && "bg-[#fff6e5] text-alert",
                        event.status === 'Borrador' && "bg-zinc-100 text-zinc-600"
                      )}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to handle classes (reusing from layout)
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

export default Dashboard;
