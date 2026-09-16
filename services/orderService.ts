import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

export type ProductRow = Database['public']['Tables']['products']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type ContainerRow = Database['public']['Tables']['containers']['Row'];

export interface SaleItemPayload {
  product_id: string;
  quantity: number;
  sale_type: 'UNIT' | 'WEIGHT' | 'SCOOP';
  container_id?: string | null;
  gross_weight?: number | null;
  tare_weight?: number | null;
  net_weight?: number | null;
  options?: {
    flavors?: string[];
    toppings?: string[];
    notes?: string;
  } | null;
  notes?: string | null;
}

export interface PaymentPayload {
  payment_method: 'money' | 'credit_card' | 'debit_card' | 'pix';
  amount: number;
  change_amount?: number;
}

export interface FinalizeSalePayload {
  session_id?: string | null;
  terminal_id?: string | null;
  employee_id?: string | null;
  customer_id?: string | null;
  discount?: number;
  items: SaleItemPayload[];
  payments: PaymentPayload[];
}

export interface FinalizeSaleResult {
  success: boolean;
  order_id: string;
  order_number: string;
  total: number;
  message: string;
}

export const orderService = {
  /**
   * Finaliza a venda chamando a RPC atômica finalize_sale no PostgreSQL.
   * O cálculo e a validação de preços são 100% seguros e processados no servidor.
   */
  async finalizeSale(payload: FinalizeSalePayload): Promise<FinalizeSaleResult> {
    const { data, error } = await supabase.rpc('finalize_sale', {
      p_sale_payload: payload as any,
    });

    if (error) {
      console.error('Erro na RPC finalize_sale:', error);
      throw new Error(error.message || 'Falha ao processar venda no servidor.');
    }

    return data as FinalizeSaleResult;
  },

  /**
   * Busca todas as categorias ativas em ordem de exibição.
   */
  async getCategories(): Promise<CategoryRow[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Busca todos os produtos ativos com informações da categoria.
   */
  async getProducts(): Promise<ProductRow[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Busca todos os recipientes ativos (copos, casquinhas, potes de peso).
   */
  async getContainers(): Promise<ContainerRow[]> {
    const { data, error } = await supabase
      .from('containers')
      .select('*')
      .eq('is_active', true)
      .order('sale_type', { ascending: false });

    if (error) {
      console.error('Erro ao buscar recipientes:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Busca terminais ativos para vínculo do PDV.
   */
  async getTerminals() {
    const { data, error } = await supabase
      .from('terminals')
      .select('*')
      .eq('is_active', true)
      .order('code', { ascending: true });

    if (error) {
      console.error('Erro ao buscar terminais:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Busca operadores de caixa ativos.
   */
  async getCashiers() {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, role, status')
      .eq('status', 'Active')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar operadores:', error);
      throw error;
    }
    return data || [];
  }
};
