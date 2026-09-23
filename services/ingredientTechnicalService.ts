import { supabase } from '../lib/supabase';
import { IngredientTechnicalProfile } from '../types';

export const ingredientTechnicalService = {
  /**
   * Busca todos os perfis técnicos cadastrados
   */
  async getAllProfiles(): Promise<IngredientTechnicalProfile[]> {
    const { data, error } = await supabase
      .from('ingredient_technical_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar perfis técnicos:', error);
      return [];
    }

    return (data || []).map((p: any) => ({
      ...p,
      water_pct: Number(p.water_pct || 0),
      total_solids_pct: Number(p.total_solids_pct || 0),
      fat_pct: Number(p.fat_pct || 0),
      msnf_pct: Number(p.msnf_pct || 0),
      lactose_pct: Number(p.lactose_pct || 0),
      sucrose_pct: Number(p.sucrose_pct || 0),
      other_sugars_pct: Number(p.other_sugars_pct || 0),
      pod_factor: Number(p.pod_factor || 0),
      pac_factor: Number(p.pac_factor || 0),
      density_g_ml: Number(p.density_g_ml || 1.0),
    }));
  },

  /**
   * Busca perfil técnico de um ingrediente específico
   */
  async getProfileByIngredientId(ingredientId: string): Promise<IngredientTechnicalProfile | null> {
    const { data, error } = await supabase
      .from('ingredient_technical_profiles')
      .select('*')
      .eq('ingredient_id', ingredientId)
      .maybeSingle();

    if (error) {
      console.error(`Erro ao buscar perfil do ingrediente ${ingredientId}:`, error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      water_pct: Number(data.water_pct || 0),
      total_solids_pct: Number(data.total_solids_pct || 0),
      fat_pct: Number(data.fat_pct || 0),
      msnf_pct: Number(data.msnf_pct || 0),
      lactose_pct: Number(data.lactose_pct || 0),
      sucrose_pct: Number(data.sucrose_pct || 0),
      other_sugars_pct: Number(data.other_sugars_pct || 0),
      pod_factor: Number(data.pod_factor || 0),
      pac_factor: Number(data.pac_factor || 0),
      density_g_ml: Number(data.density_g_ml || 1.0),
    };
  },

  /**
   * Salva ou atualiza a ficha técnica do ingrediente
   */
  async saveProfile(profile: Partial<IngredientTechnicalProfile> & { ingredient_id: string }): Promise<IngredientTechnicalProfile> {
    const payload = {
      ingredient_id: profile.ingredient_id,
      water_pct: profile.water_pct ?? 0,
      total_solids_pct: profile.total_solids_pct ?? 0,
      fat_pct: profile.fat_pct ?? 0,
      msnf_pct: profile.msnf_pct ?? 0,
      lactose_pct: profile.lactose_pct ?? 0,
      sucrose_pct: profile.sucrose_pct ?? 0,
      other_sugars_pct: profile.other_sugars_pct ?? 0,
      pod_factor: profile.pod_factor ?? 0,
      pac_factor: profile.pac_factor ?? 0,
      density_g_ml: profile.density_g_ml ?? 1.0,
      is_mix_ingredient: profile.is_mix_ingredient ?? true,
      data_status: profile.data_status ?? 'ESTIMATED',
      source: profile.source || null,
      notes: profile.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('ingredient_technical_profiles')
      .upsert(payload, { onConflict: 'ingredient_id' })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar perfil técnico:', error);
      throw new Error(error.message || 'Falha ao salvar perfil técnico.');
    }

    return data as any;
  },

  /**
   * Busca todos os ingredientes já combinados com seus perfis técnicos para telas de formulação
   */
  async getIngredientsWithProfiles() {
    const { data: ingredients, error: errIng } = await supabase
      .from('ingredients')
      .select(`
        id,
        name,
        unit,
        cost_per_unit,
        current_stock,
        min_stock,
        is_active,
        category:category_id(id, name)
      `)
      .eq('is_active', true)
      .order('name');

    if (errIng) {
      console.error('Erro ao buscar ingredientes:', errIng);
      return [];
    }

    const profiles = await this.getAllProfiles();
    const profileMap = new Map<string, IngredientTechnicalProfile>();
    profiles.forEach((p) => profileMap.set(p.ingredient_id, p));

    return (ingredients || []).map((ing: any) => ({
      ...ing,
      profile: profileMap.get(ing.id) || null,
    }));
  }
};
