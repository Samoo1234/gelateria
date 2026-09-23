import { supabase } from '../lib/supabase';
import { calculateFormulation, extractTechnicalProfile } from './formulationEngine';
import { FormulationIngredientItem } from '../types';

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
        recipes:recipe_id(id, name, yield, recipe_type, product_id, products:product_id(name)),
        employees:employee_id(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar lotes de produção:', error);
      return [];
    }

    return (data || []).map((b: any) => ({
      ...b,
      recipes: {
        name: b.recipes?.name || b.recipes?.products?.name || 'Fórmula de Gelato',
        yield_quantity: Number(b.recipes?.yield || 10),
        yield_unit: 'kg'
      },
      planned_quantity: Number(b.planned_quantity || 0),
      produced_quantity: b.produced_quantity ? Number(b.produced_quantity) : null,
      loss_quantity: b.loss_quantity ? Number(b.loss_quantity) : null,
    }));
  },

  /**
   * Cria um novo lote de produção (status PLANNED ou IN_PROGRESS).
   * Registra autorização de desvio técnico se fornecida por operador habilitado.
   */
  async createBatch(
    recipeId: string,
    plannedQuantity: number,
    employeeId?: string,
    notes?: string,
    deviationDetails?: {
      authorized: boolean;
      authorizedBy?: string | null;
      reason?: string | null;
    }
  ): Promise<ProductionBatchRow> {
    if (plannedQuantity <= 0) {
      throw new Error('A quantidade planejada deve ser maior que zero.');
    }

    // 1. Busca os detalhes da receita e seus perfis técnicos para validação estrita
    const { data: recipe, error: recipeErr } = await supabase
      .from('recipes')
      .select(`
        id,
        name,
        recipe_type,
        target_weight_g,
        target_fat_pct,
        fat_tolerance_pct,
        recipe_items(
          id,
          quantity,
          unit,
          is_closing_ingredient,
          ingredients:ingredient_id(
            id,
            name,
            cost_per_unit,
            ingredient_technical_profiles(*)
          )
        )
      `)
      .eq('id', recipeId)
      .single();

    if (recipeErr || !recipe) {
      throw new Error('Receita não encontrada para iniciar lote de produção.');
    }

    // 2. Se for fórmula de fabricação (MANUFACTURING), aplica o motor central de formulação técnica
    if (recipe.recipe_type === 'MANUFACTURING') {
      const items: FormulationIngredientItem[] = (recipe.recipe_items || []).map((it: any) => ({
        ingredientId: it.ingredients?.id,
        ingredientName: it.ingredients?.name || 'Ingrediente',
        quantity: Number(it.quantity || 0),
        unit: it.unit,
        costPerUnit: Number(it.ingredients?.cost_per_unit || 0),
        isClosingIngredient: it.is_closing_ingredient,
        profile: extractTechnicalProfile(it.ingredients?.ingredient_technical_profiles)
      }));

      const targetG = Number(recipe.target_weight_g || 10000);
      const metrics = calculateFormulation(items, targetG);

      // Bloqueio incondicional por erro de dados técnicos (ficha ou densidade ausente)
      if (metrics.hasDataError) {
        throw new Error(
          `Não é permitido iniciar batelada: dados técnicos da fórmula incompletos (${metrics.dataErrors?.join('; ')}). Erros de dados cadastrais não podem ser contornados por autorização excepcional.`
        );
      }

      // Validação de desvio técnico mensurável de tolerância
      const isOutOfTolerance = !metrics.isBalanced;
      if (isOutOfTolerance) {
        if (!deviationDetails?.authorized) {
          throw new Error('A fórmula possui desvio técnico fora da tolerância e exige autorização gerencial com justificativa.');
        }
        if (!deviationDetails.authorizedBy) {
          throw new Error('Autorização de desvio requer a identificação do responsável (Gerente/Admin).');
        }
        if (!deviationDetails.reason || !deviationDetails.reason.trim()) {
          throw new Error('Autorização de desvio requer justificativa técnica obrigatória.');
        }
      }
    }

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
        notes: notes || null,
        deviation_authorized: deviationDetails?.authorized || false,
        deviation_authorized_by: deviationDetails?.authorizedBy || null,
        deviation_reason: deviationDetails?.reason || null
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
   * Conclui um lote de produção de forma 100% atômica e cadastra as cubas geradas
   */
  async completeBatchWithTubs(params: {
    batchId: string;
    batchCode: string;
    recipeId: string;
    productId?: string | null;
    producedQuantity: number;
    lossQuantity: number;
    employeeId: string;
    tubsCount: number;
    tubCapacityKg?: number;
    notes?: string;
  }) {
    // 1. Executa a RPC de baixa atômica de ingredientes e registro de perda
    const rpcResult = await this.completeBatch(
      params.batchId,
      params.producedQuantity,
      params.lossQuantity,
      params.employeeId,
      params.notes
    );

    // 2. Se especificado número de cubas a gerar, insere na tabela tubs
    if (params.tubsCount > 0 && params.productId) {
      const weightPerTub = Number((params.producedQuantity / params.tubsCount).toFixed(3));
      const newTubs = Array.from({ length: params.tubsCount }).map((_, idx) => ({
        code: `CB-${params.batchCode.replace('LOTE-', '')}-${idx + 1}`,
        batch_id: params.batchId,
        flavor_product_id: params.productId,
        capacity_kg: params.tubCapacityKg || weightPerTub,
        current_weight_kg: weightPerTub,
        status: 'COLD_STORAGE', // Em câmara fria aguardando ir para a vitrine
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: tubError } = await supabase.from('tubs').insert(newTubs);
      if (tubError) {
        console.error('Erro ao gerar cubas da batelada:', tubError);
      }
    }

    return rpcResult;
  },

  /**
   * Busca receitas elegíveis para fabricação em lote (tipo MANUFACTURING).
   * Fichas de montagem/venda comercial (com casquinhas/copos unitários) são excluídas da produção de caldas.
   */
  async getRecipesForProduction() {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        id,
        name,
        recipe_type,
        base_type,
        product_id,
        yield,
        prep_time,
        total_cost,
        target_weight_g,
        status,
        target_fat_pct,
        target_pod,
        target_pac,
        products:product_id(id, name, category_id, price, image_url),
        recipe_items:recipe_items(
          id,
          ingredient_id,
          quantity,
          unit,
          cost,
          is_closing_ingredient,
          ingredients:ingredient_id(
            id,
            name,
            unit,
            current_stock,
            min_stock,
            cost_per_unit,
            ingredient_technical_profiles(*)
          )
        )
      `)
      .eq('recipe_type', 'MANUFACTURING')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar receitas para produção:', error);
      return [];
    }

    return (data || []).map((r: any) => ({
      ...r,
      displayName: r.name || r.products?.name || 'Fórmula de Fabricação',
      yield: Number(r.yield || 10),
    }));
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
