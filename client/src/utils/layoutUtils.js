const daysOfWeek = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

const dayPhrases = {
  'Lunes': '¡A darle con toda!',
  'Martes': '¡Mantengamos el ritmo!',
  'Miércoles': '¡Ya pasamos la cima! Ahora a cerrar con fuerza',
  'Jueves': '¡Ya estamos en la recta final!',
  'Viernes': 'A dejar el tablero impecable y celebrar los logros',
  'Sábado': 'Seguimos construyendo experiencias increíbles',
  'Domingo': '¡Disfruta el descanso para volver mañana al 100!'
};

export function getGreetingInfo(userName, date = new Date()) {
  const firstName = userName ? userName.split(' ')[0] : 'Operador';
  const dayName = daysOfWeek[date.getDay()];
  return { firstName, dayName };
}

export function getDynamicTitle(pathname) {
  if (pathname === '/' || pathname === '/dashboard') return 'Ojo al Dato';
  if (pathname.startsWith('/tasks')) return 'Tasks';
  if (pathname.startsWith('/inventario')) return 'Bodega';
  if (pathname.startsWith('/comercial')) return 'Catálogo';
  if (pathname.startsWith('/cotizaciones')) return 'Cotizaciones';
  if (pathname.startsWith('/clientes')) return 'Clientes';
  if (pathname.startsWith('/eventos')) return 'Eventos';
  if (pathname.startsWith('/equipo')) return 'Equipo';
  if (pathname.startsWith('/perfil')) return 'Perfil';
  return 'Sunpartners';
}
