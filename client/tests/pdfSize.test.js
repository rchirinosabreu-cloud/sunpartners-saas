// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import jsPDF from 'jspdf';
import { generateQuotationPDF, generatePlannerPDF } from '../src/utils/pdfGenerator';
import { pdfQuotation } from './fixtures/pdfQuotation';

const captured = vi.hoisted(() => ({ documents: [] }));

// Keep the real PDF engine; replace only the browser download.
vi.mock('jspdf', async (importOriginal) => {
  const actual = await importOriginal();
  function PDF(...args) {
    const doc = new actual.jsPDF(...args);
    doc.save = vi.fn();
    captured.documents.push(doc);
    return doc;
  }
  PDF.API = actual.jsPDF.API;
  return { ...actual, default: PDF };
});

const logo = new Uint8Array(readFileSync(new URL('../public/logo_sp.png', import.meta.url)));
const originalAddImage = jsPDF.API.addImage;

afterEach(() => {
  vi.restoreAllMocks();
  captured.documents.length = 0;
});

describe('PDF download size with the real corporate logo', () => {
  it.each([
    ['quotation', () => generateQuotationPDF(pdfQuotation)],
    ['remission', () => generatePlannerPDF(pdfQuotation)],
    ['report', () => generatePlannerPDF(pdfQuotation, 'REPORT')],
  ])('%s preserves the logo and stays under 250 KB', (name, generate) => {
    // Node cannot load the browser URL; supply the exact same PNG bytes.
    const addImage = vi.spyOn(jsPDF.API, 'addImage').mockImplementation(function (source, ...args) {
      return originalAddImage.call(this, source === '/logo_sp.png' ? logo : source, ...args);
    });

    generate();

    const doc = captured.documents[0];
    const output = Buffer.from(doc.output('arraybuffer'));
    if (process.env.PDF_EVIDENCE_DIR) {
      mkdirSync(process.env.PDF_EVIDENCE_DIR, { recursive: true });
      writeFileSync(resolve(process.env.PDF_EVIDENCE_DIR, `${name}.pdf`), output);
    }
    expect(addImage).toHaveBeenCalledTimes(1);
    expect(Object.keys(doc.internal.collections.addImage_images)).toHaveLength(1);
    expect(doc.save).toHaveBeenCalledOnce();
    expect(output.subarray(0, 5).toString()).toBe('%PDF-');
    expect(output.byteLength).toBeLessThan(250000);
  });
});
