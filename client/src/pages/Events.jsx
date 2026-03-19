const Events = () => {
  const days = [
    { name: 'Lunes 12', count: '2 Eventos', events: [
      { type: 'Confirmado', title: 'Boda Martinez', time: '10:00 - 14:00', left: '12.5%', width: '25%', logistics: 'Camión A (Chofer: Luis)' },
      { type: 'Pendiente', title: 'Cena Corporativa Tech', time: '16:00 - 19:00', left: '50%', width: '18.75%', warning: 'Falta asignar transporte' }
    ]},
    { name: 'Martes 13', count: '1 Evento', events: [
      { type: 'Confirmado', title: 'Expo Muebles 2023 - Montaje General', time: '08:00 - 16:00', left: '0%', width: '50%' }
    ]},
    { name: 'Miércoles 14', count: '0 Eventos', events: [] }
  ];

  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

  return (
    <main className="flex flex-1 flex-col min-w-0 bg-background-light relative font-body h-full overflow-hidden">
      {/* Header */}
      <header className="flex h-[64px] items-center justify-between px-8 border-b border-zinc-200 bg-background-light shrink-0 z-10">
        <div className="flex items-center gap-6">
          <h2 className="font-display text-2xl font-semibold text-zinc-900 tracking-tight">Eventos</h2>
          <div className="flex h-8 items-center rounded border border-zinc-200 bg-zinc-50 p-[2px]">
            <button className="flex items-center justify-center px-4 h-full rounded text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
              Lista
            </button>
            <button className="flex items-center justify-center px-4 h-full rounded bg-background-light border border-zinc-200 text-[13px] font-medium text-primary">
              Calendario
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex h-9 items-center justify-center gap-2 px-4 rounded bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nuevo Evento
          </button>
        </div>
      </header>

      {/* Timeline Container */}
      <div className="flex-1 overflow-auto bg-zinc-50 relative">
        {/* Timeline Header (Time Axis) */}
        <div className="sticky top-0 z-20 flex border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm">
          <div className="w-[140px] shrink-0 border-r border-zinc-200 p-4 flex items-end">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Octubre 2024</span>
          </div>
          <div className="flex-1 flex min-w-[1200px]">
            {timeSlots.map((time, idx) => (
              <div key={idx} className={`flex-1 ${idx !== timeSlots.length - 1 ? 'border-r border-zinc-200' : ''} p-2 text-[11px] font-display text-zinc-500`}>
                {time}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Body */}
        <div className="flex flex-col min-w-fit">
          {days.map((day, dIdx) => (
            <div key={dIdx} className="flex border-b border-zinc-200 group hover:bg-white transition-colors relative min-h-[100px]">
              {/* Day Label */}
              <div className="w-[140px] shrink-0 border-r border-zinc-200 p-4 bg-zinc-50 group-hover:bg-white transition-colors z-10">
                <div className="font-display text-sm font-semibold text-zinc-900">{day.name}</div>
                <div className="text-[11px] text-zinc-500">{day.count}</div>
              </div>

              {/* Swimlane Track */}
              <div className="flex-1 relative min-w-[1200px]">
                {/* Background Grid Lines (CSS only) */}
                <div className="absolute inset-0 flex pointer-events-none opacity-20">
                  {timeSlots.map((_, i) => (
                    <div key={i} className="flex-1 border-r border-zinc-200 h-full"></div>
                  ))}
                </div>

                {day.events.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Click para agregar evento
                    </span>
                  </div>
                )}

                {day.events.map((event, eIdx) => (
                  <div
                    key={eIdx}
                    className={`absolute top-3 bottom-3 bg-white border rounded p-2 cursor-pointer z-10 hover:z-30 group/card ${
                      event.type === 'Confirmado' ? 'border-primary' : 'border-alert'
                    }`}
                    style={{ left: event.left, width: event.width }}
                  >
                    <div className="flex flex-col h-full justify-center">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${
                        event.type === 'Confirmado' ? 'text-primary' : 'text-alert'
                      }`}>
                        {event.type}
                      </span>
                      <span className="text-sm font-display font-medium text-zinc-900 truncate">{event.title}</span>
                      <span className="text-[11px] text-zinc-500 truncate">{event.time}</span>
                    </div>

                    {/* Simple Popover (structural only as per design) */}
                    <div className="hidden group-hover/card:flex absolute top-full left-0 mt-2 w-64 flex-col bg-white border border-zinc-200 rounded z-40 p-4 shadow-none">
                      <div className="font-display font-semibold text-sm mb-2 pb-2 border-b border-zinc-200">{event.title}</div>
                      <div className="flex flex-col gap-2 text-[12px]">
                        {event.logistics && (
                          <div className="flex items-center gap-2 text-zinc-500">
                            <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                            <span className="text-zinc-900">{event.logistics}</span>
                          </div>
                        )}
                        {event.warning && (
                          <div className="flex items-center gap-2 text-alert">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            <span>{event.warning}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Events;
