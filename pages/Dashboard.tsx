import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  reportService, 
  DashboardSummary, 
  TopProductMetric, 
  RecentOrderSummary,
  PaymentBreakdown
} from '../services/reportService';
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Award, 
  RefreshCw, 
  ArrowUpRight, 
  Calendar, 
  Clock, 
  CreditCard,
  QrCode,
  Banknote,
  IceCream
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary>({
    todaySalesTotal: 0,
    todayOrdersCount: 0,
    averageTicket: 0,
    totalProductsSold: 0,
    monthSalesTotal: 0
  });
  const [topProducts, setTopProducts] = useState<TopProductMetric[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrderSummary[]>([]);
  const [payments, setPayments] = useState<PaymentBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [sum, top, recent, pay] = await Promise.all([
        reportService.getDashboardSummary(),
        reportService.getTopSellingProducts(5),
        reportService.getRecentOrders(6),
        reportService.getPaymentBreakdown()
      ]);

      setSummary(sum);
      setTopProducts(top);
      setRecentOrders(recent);
      setPayments(pay);
    } catch (err) {
      console.error('Erro ao carregar métricas do dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <Layout>
      <div className="p-6 md:p-8 h-full space-y-8 max-w-7xl mx-auto overflow-y-auto">
        
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Dashboard de Vendas
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Métricas consolidadas em tempo real do quiosque e balcão da sorveteria.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-4 h-11 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              <span>Atualizar</span>
            </button>

            <NavLink
              to="/pos"
              className="flex items-center gap-2 px-5 h-11 rounded-xl bg-primary text-[#0d1b14] hover:bg-opacity-90 font-black text-sm transition-all shadow-md active:scale-95"
            >
              <ShoppingBag className="size-4" />
              <span>Abrir PDV Touch</span>
            </NavLink>
          </div>
        </header>

        {/* Stats Cards Reais */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Vendas Hoje */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Vendas Hoje</span>
              <div className="p-2 rounded-xl bg-primary/20 text-primary">
                <DollarSign className="size-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                R$ {summary.todaySalesTotal.toFixed(2).replace('.', ',')}
              </span>
              <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-1 flex items-center gap-1">
                <ArrowUpRight className="size-3.5" />
                <span>Atualizado em tempo real</span>
              </p>
            </div>
          </div>

          {/* Pedidos Atendidos */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pedidos Hoje</span>
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                <ShoppingBag className="size-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                {summary.todayOrdersCount}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Atendimentos concluídos
              </p>
            </div>
          </div>

          {/* Ticket Médio */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Ticket Médio</span>
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300">
                <TrendingUp className="size-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                R$ {summary.averageTicket.toFixed(2).replace('.', ',')}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Média por consumidor
              </p>
            </div>
          </div>

          {/* Vendas do Mês */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total no Mês</span>
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
                <Calendar className="size-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                R$ {summary.monthSalesTotal.toFixed(2).replace('.', ',')}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                Faturamento acumulado
              </p>
            </div>
          </div>
        </section>

        {/* Grid Intermediário: Top Produtos & Formas de Pagamento */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Produtos / Sabores Mais Vendidos */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Award className="size-5 text-primary" />
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  Produtos & Sabores Campeões de Venda
                </h3>
              </div>
              <span className="text-xs font-bold text-gray-400">Por volume</span>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                Nenhum produto vendido no período selecionado.
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="size-8 rounded-xl bg-primary/20 text-primary font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          {p.name}
                        </h4>
                        <span className="text-xs text-gray-400">
                          {p.totalQuantity} {p.totalQuantity > 1 ? 'unidades/bolas vendidas' : 'unidade vendida'}
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-sm text-primary">
                      R$ {p.totalRevenue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formas de Pagamento */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                Formas de Pagamento
              </h3>
              
              {payments.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  Nenhum pagamento registrado.
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map(pay => (
                    <div key={pay.method} className="p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                      <div className="flex justify-between items-center text-sm font-bold mb-1">
                        <span className="text-gray-700 dark:text-gray-300">{pay.method}</span>
                        <span className="text-gray-900 dark:text-white">
                          R$ {pay.totalAmount.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>{pay.count} transações</span>
                        <span className="font-extrabold text-primary">{pay.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${pay.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <NavLink
              to="/reports"
              className="mt-6 text-xs font-bold text-primary hover:underline text-center block"
            >
              Ver relatórios financeiros detalhados →
            </NavLink>
          </div>

        </div>

        {/* Últimos Pedidos */}
        <section className="p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Últimos Pedidos Finalizados
            </h3>
            <span className="text-xs text-gray-400">Tempo real</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs font-bold text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4">Pedido</th>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Operador</th>
                  <th className="py-3 px-4">Terminal</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Nenhum pedido finalizado hoje. Abra o PDV para realizar a primeira venda!
                    </td>
                  </tr>
                ) : (
                  recentOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3 px-4 font-black text-gray-900 dark:text-white">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {new Date(o.orderDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {o.employeeName}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold">
                          {o.terminalCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-primary">
                        R$ {o.total.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </Layout>
  );
};

export default Dashboard;
