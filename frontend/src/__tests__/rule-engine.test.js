import { describe, it, expect } from 'vitest';
import {
  calcularEstadoMantenimiento,
  sugerirProximoMantenimiento,
  REGLAS_TIPO_MANTENIMIENTO,
} from '../utils/rule-engine.js';

describe('Motor de Reglas - AutoCare', () => {
  it('debe contener las reglas por defecto para los tipos de servicio', () => {
    expect(REGLAS_TIPO_MANTENIMIENTO['Cambio de aceite']).toEqual({
      kmIntervalo: 5000,
      diasIntervalo: 180,
    });
    expect(REGLAS_TIPO_MANTENIMIENTO['Frenos']).toEqual({
      kmIntervalo: 15000,
      diasIntervalo: 365,
    });
  });

  it('debe sugerir el proximo mantenimiento correctamente', () => {
    const sugerencia = sugerirProximoMantenimiento('Cambio de aceite', '2026-01-01', 45000);
    expect(sugerencia.next_kilometers).toBe(50000);
    expect(sugerencia.next_date).toBe('2026-06-30');
  });

  it('debe calcular estado "al_dia" cuando el kilometraje y fecha estan distantes', () => {
    const mantenimiento = {
      next_kilometers: 60000,
      next_date: '2028-12-31',
    };
    const estado = calcularEstadoMantenimiento(mantenimiento, 45000);
    expect(estado.estado).toBe('al_dia');
    expect(estado.label).toBe('Al dia');
  });

  it('debe calcular estado "proximo" cuando quedan entre 500 km y 1500 km', () => {
    const mantenimiento = {
      next_kilometers: 51000,
      next_date: null,
    };
    const estado = calcularEstadoMantenimiento(mantenimiento, 50000);
    expect(estado.estado).toBe('proximo');
    expect(estado.label).toBe('Proximo');
  });

  it('debe calcular estado "urgente" cuando quedan menos de 500 km', () => {
    const mantenimiento = {
      next_kilometers: 50200,
      next_date: null,
    };
    const estado = calcularEstadoMantenimiento(mantenimiento, 50000);
    expect(estado.estado).toBe('urgente');
    expect(estado.label).toBe('Urgente');
  });

  it('debe calcular estado "vencido" cuando el kilometraje actual supera el objetivo', () => {
    const mantenimiento = {
      next_kilometers: 50000,
      next_date: null,
    };
    const estado = calcularEstadoMantenimiento(mantenimiento, 52000);
    expect(estado.estado).toBe('vencido');
    expect(estado.label).toBe('Vencido');
    expect(estado.kmRestantes).toBe(-2000);
  });
});
