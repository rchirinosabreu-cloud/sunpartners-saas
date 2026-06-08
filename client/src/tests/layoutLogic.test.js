import { describe, it, expect } from 'vitest';
import { getGreetingInfo, getDynamicTitle } from '../utils/layoutUtils';

describe('AppLayout Logic', () => {
  describe('getGreetingInfo', () => {
    it('should extract first name', () => {
      const info = getGreetingInfo('Rodny Alexander');
      expect(info.firstName).toBe('Rodny');
    });

    it('should return correct day name for Monday', () => {
      const monday = new Date('2025-05-12'); // Monday
      const info = getGreetingInfo('Rodny', monday);
      expect(info.dayName).toBe('Lunes');
    });

    it('should return correct day name for Wednesday', () => {
      const wednesday = new Date('2025-05-14'); // Wednesday
      const info = getGreetingInfo('Rodny', wednesday);
      expect(info.dayName).toBe('Miércoles');
    });
  });

  describe('getDynamicTitle', () => {
    it('should return Ojo al Dato for /', () => {
      expect(getDynamicTitle('/')).toBe('Ojo al Dato');
    });

    it('should return Tasks for /tasks', () => {
      expect(getDynamicTitle('/tasks')).toBe('Tasks');
    });

    it('should return Bodega for /inventario', () => {
      expect(getDynamicTitle('/inventario')).toBe('Bodega');
    });
  });
});
