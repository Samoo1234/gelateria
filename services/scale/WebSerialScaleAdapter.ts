import { ScaleAdapter, ScaleReading, ScaleStatus } from './ScaleAdapter';

/**
 * WebSerialScaleAdapter
 * Comunica com balanças seriais via Web Serial API nativa do navegador (Toledo Prix 3, Filizola Platina, Urano POP).
 * Protocolo padrão contínuo: STX (0x02) + 5 ou 6 dígitos de peso em gramas + ETX (0x03).
 */
export class WebSerialScaleAdapter implements ScaleAdapter {
  id = 'web-serial-scale';
  name = 'Balança Serial (Toledo / Filizola / Urano)';
  status: ScaleStatus = 'disconnected';

  private port: any = null;
  private reader: any = null;
  private isReading = false;
  private currentReading: ScaleReading = {
    weightKg: 0,
    isStable: false,
    unit: 'kg'
  };
  private listeners: Array<(reading: ScaleReading) => void> = [];

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  async connect(): Promise<boolean> {
    if (!WebSerialScaleAdapter.isSupported()) {
      console.warn('Web Serial API não suportada neste navegador.');
      this.status = 'error';
      return false;
    }

    try {
      this.status = 'connecting';
      // Solicita seleção de porta serial pelo usuário
      this.port = await (navigator as any).serial.requestPort();
      
      // Padrão balanças comerciais brasileiras: 9600 ou 4800 baud, 8 bits de dados, 1 stop bit, sem paridade
      await this.port.open({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });

      this.status = 'connected';
      this.startContinuousReading();
      return true;
    } catch (err) {
      console.error('Falha ao conectar na balança serial:', err);
      this.status = 'error';
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {}
      this.reader = null;
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch {}
      this.port = null;
    }
    this.status = 'disconnected';
    this.listeners = [];
  }

  async readWeight(): Promise<ScaleReading> {
    return this.currentReading;
  }

  onWeightChange(callback: (reading: ScaleReading) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentReading);

    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private async startContinuousReading() {
    if (!this.port || !this.port.readable || this.isReading) return;

    this.isReading = true;
    let buffer = '';

    try {
      while (this.port.readable && this.isReading) {
        this.reader = this.port.readable.getReader();
        try {
          while (true) {
            const { value, done } = await this.reader.read();
            if (done) break;
            if (value) {
              const chunkText = new TextDecoder().decode(value);
              buffer += chunkText;

              // Procura por delimitadores de frame Toledo/Filizola (ex: \x02 ... \x03 ou \r\n)
              const frames = buffer.split(/[\r\n\x03]+/);
              if (frames.length > 1) {
                // Processa o frame completo mais recente
                const completeFrame = frames[frames.length - 2].replace(/[\x02\x05]/g, '').trim();
                buffer = frames[frames.length - 1]; // Mantém o resto inacabado

                this.parseFrame(completeFrame);
              }
            }
          }
        } finally {
          this.reader.releaseLock();
        }
      }
    } catch (err) {
      console.error('Erro de leitura contínua da balança:', err);
      this.status = 'error';
    } finally {
      this.isReading = false;
    }
  }

  /**
   * Faz o parser do frame de peso da balança
   * Exemplo Toledo Prix 3: "00.450" ou "00450"
   */
  private parseFrame(frame: string) {
    // Extrai números e pontos
    const cleanNumbers = frame.replace(/[^0-9.]/g, '');
    if (!cleanNumbers) return;

    let weightKg = 0;
    if (cleanNumbers.includes('.')) {
      weightKg = parseFloat(cleanNumbers);
    } else if (cleanNumbers.length >= 4) {
      // Se vier sem ponto decimal, ex: "00450" = 0.450 kg (450g)
      weightKg = parseInt(cleanNumbers, 10) / 1000;
    }

    if (!isNaN(weightKg) && weightKg >= 0 && weightKg <= 35) {
      this.currentReading = {
        weightKg: Number(weightKg.toFixed(3)),
        isStable: true,
        unit: 'kg',
        raw: frame
      };

      this.notifyListeners(this.currentReading);
    }
  }

  private notifyListeners(reading: ScaleReading) {
    this.listeners.forEach(cb => {
      try {
        cb(reading);
      } catch (err) {
        console.error('Erro no listener da balança serial:', err);
      }
    });
  }
}
