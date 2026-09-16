import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Recipe = Database['public']['Tables']['recipes']['Row'];
type RecipeInsert = Database['public']['Tables']['recipes']['Insert'];
type RecipeUpdate = Database['public']['Tables']['recipes']['Update'];
type RecipeItem = Database['public']['Tables']['recipe_items']['Row'];
type RecipeItemInsert = Database['public']['Tables']['recipe_items']['Insert'];

export interface RecipeWithItems extends Recipe {
    product_name?: string;
    items: RecipeItem[];
}

export interface RecipeItemWithIngredient extends RecipeItem {
    ingredient_name?: string;
}

// Get all recipes
export async function getRecipes() {
    const { data, error } = await supabase
        .from('recipes')
        .select(`
      *,
      products(name, price, image_url),
      recipe_items(
        *,
        ingredients(name, unit, cost_per_unit)
      )
    `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

// Get recipe by ID with items
export async function getRecipeById(id: string) {
    const { data, error } = await supabase
        .from('recipes')
        .select(`
      *,
      products(name, price, image_url),
      recipe_items(
        *,
        ingredients(name, unit, cost_per_unit)
      )
    `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

// Get recipe by product ID
export async function getRecipeByProductId(productId: string) {
    const { data, error } = await supabase
        .from('recipes')
        .select(`
      *,
      products(name, price, image_url),
      recipe_items(
        *,
        ingredients(name, unit, cost_per_unit)
      )
    `)
        .eq('product_id', productId)
        .eq('is_active', true)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // No recipe found
        throw error;
    }
    return data;
}

// Create recipe with items
export async function createRecipe(recipe: RecipeInsert, items: RecipeItemInsert[]) {
    // Start a transaction-like operation
    // 1. Create recipe
    const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert(recipe)
        .select()
        .single();

    if (recipeError) throw recipeError;

    // 2. Create recipe items
    const itemsWithRecipeId = items.map(item => ({
        ...item,
        recipe_id: recipeData.id
    }));

    const { data: itemsData, error: itemsError } = await supabase
        .from('recipe_items')
        .insert(itemsWithRecipeId)
        .select();

    if (itemsError) {
        // If items creation fails, delete the recipe
        await supabase.from('recipes').delete().eq('id', recipeData.id);
        throw itemsError;
    }

    return { recipe: recipeData, items: itemsData };
}

// Update recipe
export async function updateRecipe(id: string, updates: RecipeUpdate) {
    const { data, error } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Update recipe items
export async function updateRecipeItems(recipeId: string, items: RecipeItemInsert[]) {
    // 1. Delete existing items
    const { error: deleteError } = await supabase
        .from('recipe_items')
        .delete()
        .eq('recipe_id', recipeId);

    if (deleteError) throw deleteError;

    // 2. Insert new items
    const itemsWithRecipeId = items.map((item, index) => ({
        ...item,
        recipe_id: recipeId,
        display_order: index
    }));

    const { data, error } = await supabase
        .from('recipe_items')
        .insert(itemsWithRecipeId)
        .select();

    if (error) throw error;
    return data;
}

// Delete recipe (soft delete)
export async function deleteRecipe(id: string) {
    const { data, error } = await supabase
        .from('recipes')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get recipes detailed (using view if needed)
export async function getRecipesDetailed() {
    const { data, error } = await supabase
        .from('v_recipes_detailed')
        .select('*');

    if (error) throw error;
    return data;
}
