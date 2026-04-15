import { describe, it, expect } from 'vitest';
import { toSentenceCase, toTitleCase, normalizeData } from '../utils/formatters';

describe('formatters utility', () => {
    describe('toSentenceCase', () => {
        it('should capitalize only the first letter', () => {
            expect(toSentenceCase('HELLO WORLD')).toBe('Hello world');
            expect(toSentenceCase('hello world')).toBe('Hello world');
            expect(toSentenceCase('hELLO WORLD')).toBe('Hello world');
        });

        it('should handle empty or null strings', () => {
            expect(toSentenceCase('')).toBe('');
            expect(toSentenceCase(null)).toBe('');
            expect(toSentenceCase(undefined)).toBe('');
        });
    });

    describe('toTitleCase', () => {
        it('should capitalize the first letter of each word', () => {
            expect(toTitleCase('evelyn perez')).toBe('Evelyn Perez');
            expect(toTitleCase('EVELYN PEREZ')).toBe('Evelyn Perez');
        });
    });

    describe('normalizeData', () => {
        it('should convert all caps to sentence case', () => {
            expect(normalizeData('COMPRAS SNACK OFICINA')).toBe('Compras snack oficina');
        });

        it('should keep mixed case as is', () => {
            expect(normalizeData('Normal Task Title')).toBe('Normal Task Title');
        });

        it('should handle short uppercase strings (acronyms)', () => {
            expect(normalizeData('VIP')).toBe('VIP');
        });
    });
});
