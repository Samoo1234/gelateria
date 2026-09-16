import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export interface ProductWithCost extends Product {
    category_name?: string;
    total_cost?: number;
    profit?: number;
    margin_percentage?: number;
}

// Get all products
export async function getProducts() {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      categories(name)
    `)
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data;
}

// Get products with cost information (using view)
export async function getProductsWithCost() {
    const { data, error } = await supabase
        .from('v_products_with_cost')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data as ProductWithCost[];
}

// Get product by ID
export async function getProductById(id: string) {
    const { data, error } = await supabase
        .from('products')
        .select(`
      *,
      categories(name),
      recipes(*)
    `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

// Create product
export async function createProduct(product: ProductInsert) {
    const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Update product
export async function updateProduct(id: string, updates: ProductUpdate) {
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Delete product (soft delete)
export async function deleteProduct(id: string) {
    const { data, error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Get products by category
export async function getProductsByCategory(categoryId: string) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name');

    if (error) throw error;
    return data;
}
