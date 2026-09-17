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
  idempotency_key?: string | null;
  items: SaleItemPayload[];
  payments: PaymentPayload[];
}

export interface FinalizeSaleResult {
  success: boolean;
  order_id: string;
  order_number: string;
  total: number;
  subtotal?: number;
  discount?: number;
  total_paid?: number;
  is_replay?: boolean;
  message?: string;
}

export interface PricingRuleRow {
  id: string;
  sale_type: string;
  scoop_count: number;
  base_price: number;
  container_id: string | null;
  product_id: string | null;
  priority: number;
  is_active: boolean;
}

export const orderService = {
  /**
   * Finaliza a venda chamando a RPC atômica finalize_sale no PostgreSQL.
   * O cálculo e a validação de preços são 100% seguros e processados no servidor.
   * Suporta idempotência contra duplo clique / refresh acidental.
   */
  async finalizeSale(payload: FinalizeSalePayload): Promise<FinalizeSaleResult> {
    // Normaliza os métodos de pagamento para o formato do CHECK constraint do banco
    const methodMap: Record<string, string> = {
      'money': 'DINHEIRO',
      'pix': 'PIX',
      'debit_card': 'CARTAO_DEBITO',
      'credit_card': 'CARTAO_CREDITO',
      'DINHEIRO': 'DINHEIRO',
      'PIX': 'PIX',
      'CARTAO_DEBITO': 'CARTAO_DEBITO',
      'CARTAO_CREDITO': 'CARTAO_CREDITO'
    };

    const idempotencyKey = payload.idempotency_key || `pos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const normalizedPayload = {
      ...payload,
      idempotency_key: idempotencyKey,
      payments: payload.payments.map(p => ({
        ...p,
        payment_method: methodMap[p.payment_method] || 'DINHEIRO'
      }))
    };

    const { data, error } = await supabase.rpc('finalize_sale', {
      p_sale_payload: normalizedPayload as any,
    });

    if (error) {
      console.error('Erro na RPC finalize_sale:', error);
      throw new Error(error.message || 'Falha ao processar venda no servidor.');
    }

    return data as FinalizeSaleResult;
  },

  /**
   * Cancela uma venda de forma atômica e auditável.
   * Estorna pontos de fidelidade se houver cliente vinculado e registra log de auditoria.
   */
  async cancelSale(orderId: string, employeeId: string, reason: string) {
    const { data, error } = await supabase.rpc('cancel_sale', {
      p_order_id: orderId,
      p_cancelled_by: employeeId,
      p_reason: reason
    });

    if (error) {
      console.error('Erro ao cancelar venda:', error);
      throw new Error(error.message || 'Falha ao cancelar venda.');
    }

    return data;
  },

  /**
   * Busca as regras de precificação ativas (tabela progressiva de bolas).
   */
  async getPricingRules(): Promise<PricingRuleRow[]> {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Erro ao buscar regras de precificação:', error);
      return [];
    }
    return (data || []).map((r: any) => ({
      ...r,
      base_price: Number(r.base_price)
    }));
  },

  /**
   * Busca detalhes completos de um pedido pelo ID (para comprovante / reimpressão).
   */
  async getOrderById(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products:product_id(name),
          containers:container_id(name)
        ),
        order_payments (*)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Erro ao buscar pedido por ID:', error);
      throw error;
    }
    return data;
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
