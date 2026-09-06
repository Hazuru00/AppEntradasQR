import { describe, it, expect } from 'vitest';
import { formatUSD, formatBs, sanitizeReference, formatCedula } from '@/lib/utils';

describe('Backend Utils: Formateo y Sanitización', () => {
  describe('formatUSD', () => {
    it('debe formatear números enteros en USD sin decimales innecesarios', () => {
      expect(formatUSD(3)).toBe('$3');
      expect(formatUSD(15)).toBe('$15');
    });

    it('debe formatear montos con decimales correctamente', () => {
      expect(formatUSD(3.5)).toBe('$3.50');
    });
  });

  describe('formatBs', () => {
    it('debe formatear montos en Bolívares con separador de miles y sufijo Bs', () => {
      expect(formatBs(3000)).toContain('3.000');
      expect(formatBs(3000)).toContain('Bs');
      expect(formatBs(15000)).toContain('15.000');
    });
  });

  describe('sanitizeReference', () => {
    it('debe limpiar espacios y caracteres especiales de la referencia de Pago Móvil', () => {
      expect(sanitizeReference(' 123 456 ')).toBe('123456');
      expect(sanitizeReference('REF#987-654.')).toBe('REF987654');
    });
  });

  describe('formatCedula', () => {
    it('debe anteponer el prefijo V- si el usuario ingresó solo los números', () => {
      expect(formatCedula('24123456')).toBe('V-24123456');
    });

    it('debe respetar si ya tiene prefijo V- o E-', () => {
      expect(formatCedula('V-24123456')).toBe('V-24123456');
      expect(formatCedula('e-81234567')).toBe('E-81234567');
      expect(formatCedula('J-12345678')).toBe('J-12345678');
    });
  });
});
