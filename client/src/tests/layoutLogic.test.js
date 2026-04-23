import { describe, it, expect } from 'vitest';

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

function getGreetingInfo(userName, date = new Date()) {
  const firstName = userName ? userName.split(' ')[0] : 'Operador';
  const dayName = daysOfWeek[date.getDay()];
  const phrase = dayPhrases[dayName];
  return { firstName, dayName, phrase };
}

function getDynamicTitle(pathname) {
  if (pathname === '/' || pathname === '/dashboard') return 'Dashboard';
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

describe('AppLayout Logic', () => {
  describe('getGreetingInfo', () => {
    it('should extract first name', () => {
      const info = getGreetingInfo('Rodny Alexander');
      expect(info.firstName).toBe('Rodny');
    });

    it('should return correct phrase for Monday', () => {
      const monday = new Date('2025-05-12'); // Monday
      const info = getGreetingInfo('Rodny', monday);
      expect(info.dayName).toBe('Lunes');
      expect(info.phrase).toBe('¡A darle con toda!');
    });

    it('should return correct phrase for Wednesday', () => {
      const wednesday = new Date('2025-05-14'); // Wednesday
      const info = getGreetingInfo('Rodny', wednesday);
      expect(info.dayName).toBe('Miércoles');
      expect(info.phrase).toContain('cima');
    });
  });

  describe('getDynamicTitle', () => {
    it('should return Dashboard for /', () => {
      expect(getDynamicTitle('/')).toBe('Dashboard');
    });

    it('should return Tasks for /tasks', () => {
      expect(getDynamicTitle('/tasks')).toBe('Tasks');
    });

    it('should return Bodega for /inventario', () => {
      expect(getDynamicTitle('/inventario')).toBe('Bodega');
    });
  });
});

export { getGreetingInfo, getDynamicTitle };
