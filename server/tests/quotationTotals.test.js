import { describe, it, expect } from 'vitest';
import { calculateTotals } from '../src/utils/quotationUtils';

describe('Quotation Totals Logic (Tax Exempt Support)', () => {
  it('should calculate subtotal correctly with additional days', () => {
    const items = [
      { cantidad: 2, precio_pactado: 100, dias: 3, precio_dia_adicional: 50 }, // (2*100) + (2*50*2) = 400
    ];
    const services = [];

    const totals = calculateTotals(items, services);
    expect(totals.subtotal).toBe(400);
    expect(totals.iva).toBe(76);
    expect(totals.total).toBe(476);
  });

  it('should calculate 0 IVA for tax exempt clients', () => {
    const items = [{ cantidad: 1, precio_pactado: 1000, dias: 1, precio_dia_adicional: 0 }];
    const services = [];

    const totals = calculateTotals(items, services, true);
    expect(totals.subtotal).toBe(1000);
    expect(totals.iva).toBe(0);
    expect(totals.total).toBe(1000);
  });

  it('should calculate total general correctly for regular clients', () => {
    const items = [{ cantidad: 1, precio_pactado: 1000, dias: 1, precio_dia_adicional: 0 }];
    const services = [];

    const totals = calculateTotals(items, services, false);
    expect(totals.total).toBe(1190);
  });
});
