import { supabase } from '../lib/supabase';

export interface ProductionBatchRow {
  id: string;
  batch_code: string;
  recipe_id: string;
  product_id?: string | null;
  employee_id?: string | null;
  planned_quantity: number;
  produced_quantity?: number | null;
  loss_quantity?: number | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  started_at?: string | null;
  completed_at?: string | null;
  expires_at?: string | null;
  notes?: string | null;
  created_at: string;
  recipes?: {
    name: string;
    yield_quantity?: number;
    yield_unit?: string;
  };
  employees?: {
    name: string;
  };
}

export interface StockLossRow {
  id: string;
  loss_type: 'MELTING' | 'LEFTOVER' | 'EXPIRED' | 'PRODUCTION_ERROR' | 'TASTING' | 'INTERNAL_CONSUMPTION' | 'BREAKAGE' | 'INVENTORY_DIFFERENCE' | 'OTHER';
  product_id?: string | null;
  ingredient_id?: string | null;
  tub_id?: string | null;
  batch_id?: string | null;
  quantity: number;
  unit: string;
  estimated_cost?: number | null;
  reason?: string | null;
  employee_id?: string | null;
  terminal_id?: string | null;
  created_at: string;
}

export const productionService = {
  /**
   * Busca lotes de produção com relacionamentos
   */
  async getBatches(): Promise<ProductionBatchRow[]> {
    const { data, error } = await supabase
      .from('production_batches')
      .select(`
        *,
        recipes:recipe_id(name, yield_quantity, yield_unit),
        employees:employee_id(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar lotes de produção:', error);
      return [];
    }

    return (data || []).map((b: any) => ({
      ...b,
      planned_quantity: Number(b.planned_quantity || 0),
      produced_quantity: b.produced_quantity ? Number(b.produced_quantity) : null,
      loss_quantity: b.loss_quantity ? Number(b.loss_quantity) : null,
    }));
  },

  /**
   * Cria um novo lote de produção (status PLANNED ou IN_PROGRESS)
   */
  async createBatch(
    recipeId: string,
    plannedQuantity: number,
    employeeId?: string,
    notes?: string
  ): Promise<ProductionBatchRow> {
    const batchCode = `LOTE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data, error } = await supabase
      .from('production_batches')
      .insert({
        recipe_id: recipeId,
        batch_code: batchCode,
        planned_quantity: plannedQuantity,
        employee_id: employeeId || null,
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString(),
        notes: notes || null
      })
      .select(`
        *,
        recipes:recipe_id(name, yield_quantity, yield_unit)
      `)
      .single();

    if (error) {
      console.error('Erro ao criar lote de produção:', error);
      throw new Error(error.message || 'Falha ao criar lote.');
    }

    return data as any;
  },

  /**
   * Conclui um lote de produção de forma 100% atômica (Etapa 7).
   * Consome os ingredientes da receita proporcionalmente no estoque,
   * registra perdas se houver e gera log de auditoria.
   */
  async completeBatch(
    batchId: string,
    producedQuantity: number,
    lossQuantity: number,
    employeeId: string,
    notes?: string
  ) {
    const { data, error } = await supabase.rpc('complete_production_batch', {
      p_batch_id: batchId,
      p_produced_quantity: Number(producedQuantity.toFixed(3)),
      p_loss_quantity: Number(lossQuantity.toFixed(3)),
      p_employee_id: employeeId,
      p_notes: notes || 'Conclusão de produção em fábrica'
    });

    if (error) {
      console.error('Erro na RPC complete_production_batch:', error);
      throw new Error(error.message || 'Falha ao concluir lote de produção.');
    }

    return data;
  },

  /**
   * Cancela um lote de produção não finalizado
   */
  async cancelBatch(batchId: string, employeeId?: string, reason?: string) {
    const { data, error } = await supabase
      .from('production_batches')
      .update({
        status: 'CANCELLED',
        notes: reason ? `Cancelado: ${reason}` : 'Cancelado pelo operador',
        updated_at: new Date().toISOString()
      })
      .eq('id', batchId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao cancelar lote:', error);
      throw error;
    }

    return data;
  },

  /**
   * Registra uma perda estruturada no estoque (Etapa 9)
   */
  async recordLoss(loss: {
    loss_type: StockLossRow['loss_type'];
    product_id?: string;
    ingredient_id?: string;
    tub_id?: string;
    batch_id?: string;
    quantity: number;
    unit?: string;
    estimated_cost?: number;
    reason?: string;
    employee_id?: string;
    terminal_id?: string;
  }) {
    const { data, error } = await supabase
      .from('stock_losses')
      .insert({
        loss_type: loss.loss_type,
        product_id: loss.product_id || null,
        ingredient_id: loss.ingredient_id || null,
        tub_id: loss.tub_id || null,
        batch_id: loss.batch_id || null,
        quantity: Number(loss.quantity.toFixed(3)),
        unit: loss.unit || 'kg',
        estimated_cost: loss.estimated_cost || 0.00,
        reason: loss.reason || null,
        employee_id: loss.employee_id || null,
        terminal_id: loss.terminal_id || null
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao registrar perda de estoque:', error);
      throw new Error(error.message || 'Falha ao registrar perda.');
    }

    return data;
  },

  /**
   * Lista perdas registradas
   */
  async getStockLosses(limit: number = 30) {
    const { data, error } = await supabase
      .from('stock_losses')
      .select(`
        *,
        employees:employee_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar perdas:', error);
      return [];
    }

    return data || [];
  }
};
