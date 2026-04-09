import { describe, it, expect } from 'vitest';
import { calculateTotals } from '../src/utils/quotationUtils';

describe('Quotation Totals Logic (Unified Formula)', () => {
  it('should calculate subtotal correctly with additional days', () => {
    const items = [
      { cantidad: 2, precio_pactado: 100, dias: 3, precio_dia_adicional: 50 }, // (2*100) + (2*50*2) = 200 + 200 = 400
      { cantidad: 1, precio_pactado: 50, dias: 1, precio_dia_adicional: 20 }   // (1*50) + (1*20*0) = 50
    ];
    const services = [
      { cantidad: 1, precio_pactado: 300, dias: 2, precio_dia_adicional: 300 }  // (1*300) + (1*300*1) = 600
    ];

    const totals = calculateTotals(items, services);
    expect(totals.subtotal).toBe(1050);
  });

  it('should calculate 19% IVA correctly', () => {
    const items = [{ cantidad: 1, precio_pactado: 1000, dias: 1, precio_dia_adicional: 0 }];
    const services = [];

    const totals = calculateTotals(items, services);
    expect(totals.iva).toBe(190);
  });

  it('should calculate total general correctly', () => {
    const items = [{ cantidad: 1, precio_pactado: 1000, dias: 2, precio_dia_adicional: 500 }]; // 1500
    const services = [{ cantidad: 1, precio_pactado: 500, dias: 1, precio_dia_adicional: 0 }]; // 500
    // Subtotal = 2000, IVA = 380, Total = 2380

    const totals = calculateTotals(items, services);
    expect(totals.total).toBe(2380);
  });

  it('should handle empty items or services', () => {
    const totals = calculateTotals([], []);
    expect(totals.subtotal).toBe(0);
    expect(totals.iva).toBe(0);
    expect(totals.total).toBe(0);
  });
});
