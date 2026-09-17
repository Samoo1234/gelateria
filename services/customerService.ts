import { supabase } from '../lib/supabase';

export interface CustomerRow {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  cpf?: string | null;
  points: number;
  total_spent: number;
  last_visit?: string | null;
  created_at: string;
}

export interface LoyaltyTransactionRow {
  id: string;
  customer_id: string;
  order_id?: string | null;
  type: 'EARN' | 'REDEEM' | 'ADJUSTMENT' | 'EXPIRE' | 'REVERSAL';
  points_amount: number;
  balance_after: number;
  description?: string | null;
  created_at: string;
}

export const customerService = {
  /**
   * Busca clientes por nome ou telefone (minimização LGPD)
   */
  async searchCustomers(query: string): Promise<CustomerRow[]> {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }

    return (data || []).map((c: any) => ({
      ...c,
      points: Number(c.points || 0),
      total_spent: Number(c.total_spent || 0),
    }));
  },

  /**
   * Lista todos os clientes ordenados por última visita
   */
  async getCustomers(limit: number = 50): Promise<CustomerRow[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao listar clientes:', error);
      return [];
    }

    return (data || []).map((c: any) => ({
      ...c,
      points: Number(c.points || 0),
      total_spent: Number(c.total_spent || 0),
    }));
  },

  /**
   * Cadastro rápido de cliente no balcão (apenas nome e telefone opcionais)
   */
  async createCustomer(customer: {
    name: string;
    phone?: string;
    email?: string;
  }): Promise<CustomerRow> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: customer.name.trim(),
        phone: customer.phone ? customer.phone.trim() : null,
        email: customer.email ? customer.email.trim() : null,
        points: 0,
        total_spent: 0.00
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao cadastrar cliente:', error);
      throw new Error(error.message || 'Falha ao cadastrar cliente.');
    }

    return data as any;
  },

  /**
   * Consulta extrato auditável do ledger de fidelidade (Etapa 11)
   */
  async getLoyaltyHistory(customerId: string): Promise<LoyaltyTransactionRow[]> {
    const { data, error } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar extrato de fidelidade:', error);
      return [];
    }

    return data || [];
  }
};
