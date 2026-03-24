import { describe, it, expect } from 'vitest';
import { calculateTotals } from '../src/utils/quotationUtils';

describe('Quotation Totals Logic (TDD)', () => {
  it('should calculate subtotal correctly for items and services', () => {
    const items = [
      { cantidad: 2, precio_pactado: 100 }, // 200
      { cantidad: 1, precio_pactado: 50 }   // 50
    ];
    const services = [
      { cantidad: 1, precio_pactado: 300 }  // 300
    ];

    const totals = calculateTotals(items, services);
    expect(totals.subtotal).toBe(550);
  });

  it('should calculate 19% IVA correctly', () => {
    const items = [{ cantidad: 1, precio_pactado: 1000 }];
    const services = [];

    const totals = calculateTotals(items, services);
    expect(totals.iva).toBe(190);
  });

  it('should calculate total general correctly', () => {
    const items = [{ cantidad: 1, precio_pactado: 1000 }];
    const services = [{ cantidad: 1, precio_pactado: 500 }];

    const totals = calculateTotals(items, services);
    expect(totals.total).toBe(1785);
  });

  it('should handle empty items or services', () => {
    const totals = calculateTotals([], []);
    expect(totals.subtotal).toBe(0);
    expect(totals.iva).toBe(0);
    expect(totals.total).toBe(0);
  });
});
