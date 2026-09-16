import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

export type TubRow = Database['public']['Tables']['tubs']['Row'];
export type TubInsert = Database['public']['Tables']['tubs']['Insert'];

export interface TubWithFlavor extends TubRow {
  product_name?: string;
}

export const tubService = {
  /**
   * Lista todas as cubas ativas no balcão expositor (status = 'active' ou 'in_use')
   */
  async getActiveTubs(): Promise<TubWithFlavor[]> {
    const { data, error } = await supabase
      .from('tubs')
      .select(`
        *,
        products:flavor_product_id(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar cubas ativas:', error);
      throw error;
    }

    return (data || []).map((t: any) => ({
      ...t,
      product_name: t.products?.name || 'Sabor não vinculado'
    }));
  },

  /**
   * Abre / registra uma nova cuba no balcão
   */
  async registerTub(
    flavorProductId: string,
    code: string,
    capacityKg: number = 5.0
  ): Promise<TubRow> {
    const { data, error } = await supabase
      .from('tubs')
      .insert({
        flavor_product_id: flavorProductId,
        code,
        capacity_kg: Number(capacityKg.toFixed(3)),
        current_weight_kg: Number(capacityKg.toFixed(3)),
        status: 'in_use',
        qr_code: `TUB-${code}`
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar cuba:', error);
      throw new Error(error.message || 'Falha ao registrar cuba.');
    }

    return data;
  },

  /**
   * Atualiza peso restante na cuba
   */
  async updateTubWeight(tubId: string, currentWeightKg: number): Promise<TubRow> {
    const status = currentWeightKg <= 0.1 ? 'empty' : 'in_use';
    const { data, error } = await supabase
      .from('tubs')
      .update({
        current_weight_kg: Number(currentWeightKg.toFixed(3)),
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', tubId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar peso da cuba:', error);
      throw error;
    }

    return data;
  },

  /**
   * Encerra a cuba como vazia
   */
  async closeTub(tubId: string): Promise<TubRow> {
    const { data, error } = await supabase
      .from('tubs')
      .update({
        status: 'empty',
        current_weight_kg: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', tubId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao encerrar cuba:', error);
      throw error;
    }

    return data;
  }
};
