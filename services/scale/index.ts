import { ScaleAdapter } from './ScaleAdapter';
import { ManualScaleAdapter } from './ManualScaleAdapter';
import { WebSerialScaleAdapter } from './WebSerialScaleAdapter';

export * from './ScaleAdapter';
export * from './ManualScaleAdapter';
export * from './WebSerialScaleAdapter';

class ScaleManager {
  private manualAdapter: ManualScaleAdapter;
  private serialAdapter: WebSerialScaleAdapter;
  private activeAdapter: ScaleAdapter;

  constructor() {
    this.manualAdapter = new ManualScaleAdapter();
    this.serialAdapter = new WebSerialScaleAdapter();
    this.activeAdapter = this.manualAdapter;
  }

  getManualAdapter(): ManualScaleAdapter {
    return this.manualAdapter;
  }

  getSerialAdapter(): WebSerialScaleAdapter {
    return this.serialAdapter;
  }

  getActiveAdapter(): ScaleAdapter {
    return this.activeAdapter;
  }

  useManual(): ManualScaleAdapter {
    this.activeAdapter = this.manualAdapter;
    return this.manualAdapter;
  }

  async useSerial(): Promise<ScaleAdapter> {
    const success = await this.serialAdapter.connect();
    if (success) {
      this.activeAdapter = this.serialAdapter;
      return this.serialAdapter;
    }
    this.activeAdapter = this.manualAdapter;
    return this.manualAdapter;
  }
}

export const scaleManager = new ScaleManager();
