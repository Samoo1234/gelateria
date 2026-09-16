import { ScaleAdapter, ScaleReading, ScaleStatus } from './ScaleAdapter';

export class ManualScaleAdapter implements ScaleAdapter {
  id = 'manual-scale';
  name = 'Digitação Manual de Peso';
  status: ScaleStatus = 'connected';
  
  private currentWeightKg: number = 0;
  private listeners: Array<(reading: ScaleReading) => void> = [];

  async connect(): Promise<boolean> {
    this.status = 'connected';
    return true;
  }

  async disconnect(): Promise<void> {
    this.status = 'disconnected';
    this.listeners = [];
  }

  async readWeight(): Promise<ScaleReading> {
    return {
      weightKg: this.currentWeightKg,
      isStable: true,
      unit: 'kg',
    };
  }

  /**
   * Atualiza o peso manualmente (via teclado virtual touch ou entrada do operador)
   * Valida limites operacionais de balança comercial (0 a 30kg)
   */
  setManualWeight(weightKg: number): ScaleReading {
    if (isNaN(weightKg) || weightKg < 0) {
      this.currentWeightKg = 0;
    } else if (weightKg > 30) {
      this.currentWeightKg = 30; // Limite máximo padrão balança comercial
    } else {
      this.currentWeightKg = Number(weightKg.toFixed(3));
    }

    const reading: ScaleReading = {
      weightKg: this.currentWeightKg,
      isStable: true,
      unit: 'kg',
      raw: `MANUAL:${this.currentWeightKg}kg`
    };

    this.notifyListeners(reading);
    return reading;
  }

  onWeightChange(callback: (reading: ScaleReading) => void): () => void {
    this.listeners.push(callback);
    callback({
      weightKg: this.currentWeightKg,
      isStable: true,
      unit: 'kg',
    });

    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(reading: ScaleReading) {
    this.listeners.forEach(cb => {
      try {
        cb(reading);
      } catch (err) {
        console.error('Erro no listener da balança manual:', err);
      }
    });
  }
}
