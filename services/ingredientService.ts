import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Ingredient = Database['public']['Tables']['ingredients']['Row'];
type IngredientInsert = Database['public']['Tables']['ingredients']['Insert'];
type IngredientUpdate = Database['public']['Tables']['ingredients']['Update'];

export interface IngredientWithCategory extends Ingredient {
    category_name?: string;
    supplier_name?: string;
}

// Get all ingredients
export async function getIngredients() {
    const { data, error } = await supabase
        .from('ingredients')
        .select(`
      *,
      ingredient_categories(name),
      suppliers(name)
    `)
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data;
}

// Get ingredient by ID
export async function getIngredientById(id: string) {
    const { data, error } = await supabase
        .from('ingredients')
        .select(`
      *,
      ingredient_categories(name),
      suppliers(name, phone, email)
    `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

// Create ingredient
export async function createIngredient(ingredient: IngredientInsert) {
    const { data, error } = await supabase
        .from('ingredients')
        .insert(ingredient)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Update ingredient
export async function updateIngredient(id: string, updates: IngredientUpdate) {
    const { data, error } = await supabase
        .from('ingredients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete ingredient (soft delete)
export async function deleteIngredient(id: string) {
    const { data, error } = await supabase
        .from('ingredients')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get ingredients by category
export async function getIngredientsByCategory(categoryId: string) {
    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data;
}

// Get low stock ingredients (using view)
export async function getLowStockIngredients() {
    const { data, error } = await supabase
        .from('v_low_stock_ingredients')
        .select('*');

    if (error) throw error;
    return data;
}

// Update ingredient stock
export async function updateIngredientStock(id: string, newStock: number) {
    const { data, error } = await supabase
        .from('ingredients')
        .update({
            current_stock: newStock,
            last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}
