import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

export type CashRegisterSessionRow = Database['public']['Tables']['cash_register_sessions']['Row'];
export type CashMovementRow = Database['public']['Tables']['cash_movements']['Row'];

export interface SessionSummary {
  session: CashRegisterSessionRow;
  initialAmount: number;
  totalSalesMoney: number;
  totalSalesCard: number;
  totalSalesPix: number;
  totalSangrias: number;
  totalSuprimentos: number;
  expectedCashInDrawer: number;
}

export const cashRegisterService = {
  /**
   * Obtém a sessão de caixa atualmente aberta para um terminal específico
   */
  async getCurrentSession(terminalId: string): Promise<CashRegisterSessionRow | null> {
    const { data, error } = await supabase
      .from('cash_register_sessions')
      .select('*')
      .eq('terminal_id', terminalId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar sessão ativa de caixa:', error);
      throw error;
    }

    return data;
  },

  /**
   * Abre uma nova sessão de caixa com fundo de troco inicial
   */
  async openSession(
    terminalId: string,
    employeeId: string,
    initialAmount: number,
    notes?: string
  ): Promise<CashRegisterSessionRow> {
    // Verifica se já existe caixa aberto no terminal
    const current = await this.getCurrentSession(terminalId);
    if (current) {
      throw new Error('Já existe uma sessão de caixa aberta para este terminal.');
    }

    const { data, error } = await supabase
      .from('cash_register_sessions')
      .insert({
        terminal_id: terminalId,
        employee_id: employeeId,
        initial_amount: Number(initialAmount.toFixed(2)),
        status: 'open',
        opened_at: new Date().toISOString(),
        notes: notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao abrir caixa:', error);
      throw new Error(error.message || 'Falha ao registrar abertura de caixa.');
    }

    // Registra suprimento inicial de fundo de troco como histórico
    if (initialAmount > 0) {
      await this.addCashMovement(
        data.id,
        employeeId,
        'suprimento',
        initialAmount,
        'Fundo de troco inicial (Abertura)'
      );
    }

    return data;
  },

  /**
   * Registra movimentação de dinheiro no caixa (sangria ou suprimento)
   */
  async addCashMovement(
    sessionId: string,
    employeeId: string | null,
    movementType: 'sangria' | 'suprimento',
    amount: number,
    reason: string
  ): Promise<CashMovementRow> {
    if (!reason || reason.trim() === '') {
      throw new Error('A justificativa da movimentação é obrigatória.');
    }
    if (amount <= 0) {
      throw new Error('O valor da movimentação deve ser maior que zero.');
    }

    const { data, error } = await supabase
      .from('cash_movements')
      .insert({
        session_id: sessionId,
        employee_id: employeeId,
        movement_type: movementType,
        amount: Number(amount.toFixed(2)),
        reason: reason.trim()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao registrar sangria/suprimento:', error);
      throw new Error(error.message || 'Falha ao registrar movimentação.');
    }

    return data;
  },

  /**
   * Calcula o resumo financeiro da sessão (vendas, sangrias, suprimentos e dinheiro em gaveta)
   */
  async getSessionSummary(sessionId: string): Promise<SessionSummary> {
    // 1. Busca dados da sessão
    const { data: session, error: sessErr } = await supabase
      .from('cash_register_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessErr || !session) {
      throw new Error('Sessão de caixa não encontrada.');
    }

    // 2. Busca movimentações (sangrias e suprimentos)
    const { data: movements, error: movErr } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('session_id', sessionId);

    if (movErr) {
      console.error('Erro ao buscar movimentações da sessão:', movErr);
    }

    // 3. Busca vendas vinculadas a essa sessão
    const { data: orders, error: ordErr } = await supabase
      .from('orders')
      .select(`
        id,
        order_payments(payment_method, amount)
      `)
      .eq('session_id', sessionId);

    if (ordErr) {
      console.error('Erro ao buscar vendas da sessão:', ordErr);
    }

    let totalSangrias = 0;
    let totalSuprimentos = 0;

    (movements || []).forEach(m => {
      // Ignora o suprimento de abertura para não duplicar com initial_amount
      if (m.movement_type === 'sangria') {
        totalSangrias += Number(m.amount);
      } else if (m.movement_type === 'suprimento' && !m.reason.includes('Fundo de troco inicial')) {
        totalSuprimentos += Number(m.amount);
      }
    });

    let totalSalesMoney = 0;
    let totalSalesCard = 0;
    let totalSalesPix = 0;

    (orders || []).forEach(order => {
      (order.order_payments || []).forEach((p: any) => {
        const amt = Number(p.amount);
        if (p.payment_method === 'money') {
          totalSalesMoney += amt;
        } else if (p.payment_method === 'pix') {
          totalSalesPix += amt;
        } else {
          totalSalesCard += amt;
        }
      });
    });

    const initialAmount = Number(session.initial_amount);
    const expectedCashInDrawer = initialAmount + totalSuprimentos + totalSalesMoney - totalSangrias;

    return {
      session,
      initialAmount,
      totalSalesMoney: Number(totalSalesMoney.toFixed(2)),
      totalSalesCard: Number(totalSalesCard.toFixed(2)),
      totalSalesPix: Number(totalSalesPix.toFixed(2)),
      totalSangrias: Number(totalSangrias.toFixed(2)),
      totalSuprimentos: Number(totalSuprimentos.toFixed(2)),
      expectedCashInDrawer: Number(expectedCashInDrawer.toFixed(2)),
    };
  },

  /**
   * Encerra a sessão de caixa com conferência cega/assistida e registro da diferença
   */
  async closeSession(
    sessionId: string,
    closingActualAmount: number,
    notes?: string
  ): Promise<CashRegisterSessionRow> {
    const summary = await this.getSessionSummary(sessionId);
    const expected = summary.expectedCashInDrawer;
    const difference = Number((closingActualAmount - expected).toFixed(2));

    const { data, error } = await supabase
      .from('cash_register_sessions')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closing_expected_amount: expected,
        closing_actual_amount: Number(closingActualAmount.toFixed(2)),
        difference,
        notes: notes || null
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao fechar caixa:', error);
      throw new Error(error.message || 'Falha ao encerrar sessão de caixa.');
    }

    return data;
  }
};
