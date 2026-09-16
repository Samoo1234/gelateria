export interface ScaleReading {
  weightKg: number;
  isStable: boolean;
  unit: 'kg' | 'g';
  raw?: string;
}

export type ScaleStatus = 'disconnected' | 'connecting' | 'connected' | 'reading' | 'error';

export interface ScaleAdapter {
  id: string;
  name: string;
  status: ScaleStatus;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  readWeight(): Promise<ScaleReading>;
  onWeightChange?(callback: (reading: ScaleReading) => void): () => void;
}
