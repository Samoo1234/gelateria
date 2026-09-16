import { supabase } from '../lib/supabase';

export interface DashboardSummary {
  todaySalesTotal: number;
  todayOrdersCount: number;
  averageTicket: number;
  totalProductsSold: number;
  monthSalesTotal: number;
}

export interface TopProductMetric {
  id: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface PaymentBreakdown {
  method: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  orderDate: string;
  total: number;
  employeeName?: string;
  terminalCode?: string;
  itemCount: number;
}

export const reportService = {
  /**
   * Resumo de vendas para os cards superiores do Dashboard
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Vendas de hoje
    const { data: todayOrders, error: todayErr } = await supabase
      .from('orders')
      .select('id, total, status')
      .gte('order_date', todayStart.toISOString());

    if (todayErr) console.error('Erro ao buscar vendas de hoje:', todayErr);

    // Vendas do mês
    const { data: monthOrders, error: monthErr } = await supabase
      .from('orders')
      .select('total')
      .gte('order_date', monthStart.toISOString());

    if (monthErr) console.error('Erro ao buscar vendas do mês:', monthErr);

    // Itens vendidos hoje
    const todayIds = (todayOrders || []).map(o => o.id);
    let totalProductsSold = 0;

    if (todayIds.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('quantity')
        .in('order_id', todayIds);

      (items || []).forEach(i => {
        totalProductsSold += Number(i.quantity || 1);
      });
    }

    const todayOrdersCount = (todayOrders || []).length;
    const todaySalesTotal = (todayOrders || []).reduce((acc, o) => acc + Number(o.total || 0), 0);
    const monthSalesTotal = (monthOrders || []).reduce((acc, o) => acc + Number(o.total || 0), 0);
    const averageTicket = todayOrdersCount > 0 ? todaySalesTotal / todayOrdersCount : 0;

    return {
      todaySalesTotal: Number(todaySalesTotal.toFixed(2)),
      todayOrdersCount,
      averageTicket: Number(averageTicket.toFixed(2)),
      totalProductsSold,
      monthSalesTotal: Number(monthSalesTotal.toFixed(2))
    };
  },

  /**
   * Ranking dos produtos mais vendidos
   */
  async getTopSellingProducts(limit: number = 5): Promise<TopProductMetric[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        subtotal,
        product_id,
        products(name)
      `);

    if (error || !data) {
      console.error('Erro ao buscar top produtos:', error);
      return [];
    }

    const map = new Map<string, { name: string; qty: number; rev: number }>();

    data.forEach((item: any) => {
      const pid = item.product_id;
      const pName = item.products?.name || 'Produto';
      const qty = Number(item.quantity || 1);
      const sub = Number(item.subtotal || 0);

      if (!map.has(pid)) {
        map.set(pid, { name: pName, qty: 0, rev: 0 });
      }
      const cur = map.get(pid)!;
      cur.qty += qty;
      cur.rev += sub;
    });

    const list: TopProductMetric[] = Array.from(map.entries()).map(([id, val]) => ({
      id,
      name: val.name,
      totalQuantity: val.qty,
      totalRevenue: Number(val.rev.toFixed(2))
    }));

    return list.sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, limit);
  },

  /**
   * Distribuição de faturamento por método de pagamento
   */
  async getPaymentBreakdown(): Promise<PaymentBreakdown[]> {
    const { data, error } = await supabase
      .from('order_payments')
      .select('payment_method, amount');

    if (error || !data) {
      console.error('Erro ao buscar formas de pagamento:', error);
      return [];
    }

    const map = new Map<string, { total: number; count: number }>();
    let grandTotal = 0;

    data.forEach(p => {
      const m = p.payment_method;
      const amt = Number(p.amount || 0);
      grandTotal += amt;

      if (!map.has(m)) {
        map.set(m, { total: 0, count: 0 });
      }
      const cur = map.get(m)!;
      cur.total += amt;
      cur.count += 1;
    });

    const labels: Record<string, string> = {
      'DINHEIRO': 'Dinheiro',
      'PIX': 'PIX',
      'CARTAO_DEBITO': 'Cartão de Débito',
      'CARTAO_CREDITO': 'Cartão de Crédito',
      'VALE_REFEICAO': 'Vale Refeição'
    };

    return Array.from(map.entries()).map(([method, val]) => ({
      method: labels[method] || method,
      totalAmount: Number(val.total.toFixed(2)),
      count: val.count,
      percentage: grandTotal > 0 ? Number(((val.total / grandTotal) * 100).toFixed(1)) : 0
    }));
  },

  /**
   * Últimos pedidos finalizados
   */
  async getRecentOrders(limit: number = 10): Promise<RecentOrderSummary[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        order_date,
        total,
        employees(name),
        terminals(code),
        order_items(count)
      `)
      .order('order_date', { ascending: false })
      .limit(limit);

    if (error || !data) {
      console.error('Erro ao buscar pedidos recentes:', error);
      return [];
    }

    return data.map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      orderDate: o.order_date,
      total: Number(o.total || 0),
      employeeName: o.employees?.name || 'Operador',
      terminalCode: o.terminals?.code || 'PDV',
      itemCount: o.order_items?.[0]?.count || 1
    }));
  }
};
