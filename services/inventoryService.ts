import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

export type IngredientRow = Database['public']['Tables']['ingredients']['Row'];
export type InventoryMovementRow = Database['public']['Tables']['inventory_movements']['Row'];

export interface LowStockIngredient {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
  cost_per_unit: number;
  deficit?: number;
}

export interface InventoryStats {
  totalItems: number;
  inStockItems: number;
  lowStockCount: number;
  totalStockValue: number;
}

export const inventoryService = {
  /**
   * Obtém os indicadores de estoque calculados com base no banco real
   */
  async getInventoryStats(): Promise<InventoryStats> {
    const { data: ingredients, error } = await supabase
      .from('ingredients')
      .select('id, current_stock, min_stock, cost_per_unit')
      .eq('is_active', true);

    if (error) {
      console.error('Erro ao calcular estatísticas de estoque:', error);
      throw error;
    }

    const items = ingredients || [];
    let totalStockValue = 0;
    let inStockItems = 0;
    let lowStockCount = 0;

    items.forEach(item => {
      const stock = Number(item.current_stock || 0);
      const min = Number(item.min_stock || 0);
      const cost = Number(item.cost_per_unit || 0);

      totalStockValue += stock * cost;
      if (stock > 0) inStockItems++;
      if (stock <= min) lowStockCount++;
    });

    return {
      totalItems: items.length,
      inStockItems,
      lowStockCount,
      totalStockValue: Number(totalStockValue.toFixed(2))
    };
  },

  /**
   * Consulta a view oficial v_low_stock_ingredients
   */
  async getLowStockIngredients(): Promise<LowStockIngredient[]> {
    const { data, error } = await supabase
      .from('v_low_stock_ingredients')
      .select('*');

    if (error) {
      console.error('Erro ao buscar ingredientes com baixo estoque:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      current_stock: Number(item.current_stock || 0),
      min_stock: Number(item.min_stock || 0),
      unit: item.unit,
      cost_per_unit: Number(item.cost_per_unit || 0),
      deficit: Math.max(0, Number((item.min_stock - item.current_stock).toFixed(3)))
    }));
  },

  /**
   * Registra uma movimentação de estoque (entrada, saída, perda, ajuste)
   */
  async recordMovement(
    ingredientId: string,
    movementType: 'IN' | 'OUT' | 'LOSS' | 'ADJUST',
    quantity: number,
    unit: string,
    reason?: string,
    notes?: string
  ): Promise<InventoryMovementRow> {
    // 1. Busca custo unitário atual do ingrediente
    const { data: ing, error: ingErr } = await supabase
      .from('ingredients')
      .select('cost_per_unit, current_stock')
      .eq('id', ingredientId)
      .single();

    if (ingErr || !ing) {
      throw new Error('Ingrediente não encontrado.');
    }

    const costPerUnit = Number(ing.cost_per_unit || 0);
    const totalCost = Number((costPerUnit * quantity).toFixed(2));

    // 2. Registra a movimentação
    const { data: movement, error: movErr } = await supabase
      .from('inventory_movements')
      .insert({
        ingredient_id: ingredientId,
        movement_type: movementType,
        quantity: Number(quantity.toFixed(3)),
        unit,
        cost_per_unit: costPerUnit,
        total_cost: totalCost,
        reason: reason || null,
        notes: notes || null,
        movement_date: new Date().toISOString()
      })
      .select()
      .single();

    if (movErr) {
      console.error('Erro ao inserir movimentação de estoque:', movErr);
      throw movErr;
    }

    // 3. Atualiza o estoque atual do ingrediente
    const currentStock = Number(ing.current_stock || 0);
    let newStock = currentStock;

    if (movementType === 'IN') {
      newStock += quantity;
    } else if (movementType === 'OUT' || movementType === 'LOSS') {
      newStock = Math.max(0, currentStock - quantity);
    } else if (movementType === 'ADJUST') {
      newStock = quantity; // ajusta diretamente para o novo saldo
    }

    await supabase
      .from('ingredients')
      .update({
        current_stock: Number(newStock.toFixed(3)),
        last_updated: new Date().toISOString()
      })
      .eq('id', ingredientId);

    return movement;
  },

  /**
   * Busca as movimentações recentes de estoque
   */
  async getRecentMovements(limit: number = 20) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .select(`
        *,
        ingredients(name)
      `)
      .order('movement_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao carregar movimentações:', error);
      throw error;
    }

    return (data || []).map((m: any) => ({
      ...m,
      ingredient_name: m.ingredients?.name || 'Ingrediente Desconhecido'
    }));
  }
};
