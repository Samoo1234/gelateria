import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  reportService, 
  DashboardSummary, 
  TopProductMetric, 
  PaymentBreakdown,
  RecentOrderSummary
} from '../services/reportService';
import { 
  Download, 
  Calendar, 
  CreditCard, 
  ShoppingBag, 
  RefreshCw, 
  DollarSign,
  TrendingUp,
  PieChart,
  FileSpreadsheet
} from 'lucide-react';

const Reports: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary>({
    todaySalesTotal: 0,
    todayOrdersCount: 0,
    averageTicket: 0,
    totalProductsSold: 0,
    monthSalesTotal: 0
  });
  const [topProducts, setTopProducts] = useState<TopProductMetric[]>([]);
  const [payments, setPayments] = useState<PaymentBreakdown[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const [sum, top, pay, recent] = await Promise.all([
        reportService.getDashboardSummary(),
        reportService.getTopSellingProducts(10),
        reportService.getPaymentBreakdown(),
        reportService.getRecentOrders(25)
      ]);

      setSummary(sum);
      setTopProducts(top);
      setPayments(pay);
      setRecentOrders(recent);
    } catch (err) {
      console.error('Erro ao gerar relatórios:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const handleExportCSV = () => {
    if (recentOrders.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    const headers = 'Pedido,Data,Operador,Terminal,Total\n';
    const rows = recentOrders.map(o => 
      `"${o.orderNumber}","${new Date(o.orderDate).toLocaleString('pt-BR')}","${o.employeeName}","${o.terminalCode}","${o.total.toFixed(2)}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-vendas-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 h-full space-y-8 max-w-7xl mx-auto overflow-y-auto">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Relatórios & Análise Comercial
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Desempenho de vendas, auditoria de pagamentos e ranking de faturamento.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadReportData}
              className="flex items-center gap-2 px-4 h-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-bold transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-5 h-10 rounded-xl bg-primary text-[#0d1b14] hover:bg-opacity-90 text-sm font-black transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <FileSpreadsheet className="size-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Resumo de Desempenho */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Faturamento Acumulado</span>
            <span className="text-3xl font-black text-primary block mt-2">
              R$ {summary.monthSalesTotal.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-xs text-gray-400 mt-1 block">Consolidado do período</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total de Pedidos</span>
            <span className="text-3xl font-black text-gray-900 dark:text-white block mt-2">
              {summary.todayOrdersCount}
            </span>
            <span className="text-xs text-gray-400 mt-1 block">Transações finalizadas</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Ticket Médio</span>
            <span className="text-3xl font-black text-green-600 dark:text-green-400 block mt-2">
              R$ {summary.averageTicket.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-xs text-gray-400 mt-1 block">Receita média por atendimento</span>
          </div>
        </div>

        {/* Relatório por Forma de Pagamento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="size-5 text-primary" />
              <span>Recebimento por Forma de Pagamento</span>
            </h3>

            {payments.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                Nenhum pagamento registrado ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map(p => (
                  <div key={p.method} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <div>
                      <span className="font-bold text-sm text-gray-900 dark:text-white block">
                        {p.method}
                      </span>
                      <span className="text-xs text-gray-400">
                        {p.count} transações ({p.percentage}%)
                      </span>
                    </div>
                    <span className="font-extrabold text-base text-primary">
                      R$ {p.totalAmount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ranking Top Produtos */}
          <div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" />
              <span>Top Produtos e Sabores Vendidos</span>
            </h3>

            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                Nenhum produto computado.
              </div>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="flex items-center gap-2.5">
                      <span className="size-6 rounded-md bg-primary/20 text-primary font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-sm text-gray-900 dark:text-white block">
                          {p.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {p.totalQuantity} unidades
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-sm text-gray-900 dark:text-white">
                      R$ {p.totalRevenue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Pedidos do Período */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Histórico Detalhado de Vendas
            </h3>
            <span className="text-xs font-semibold text-gray-400">
              {recentOrders.length} pedidos listados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-surface-dark/90 text-xs font-bold text-gray-500 uppercase border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Número do Pedido</th>
                  <th className="px-6 py-4">Data e Hora</th>
                  <th className="px-6 py-4">Operador de Caixa</th>
                  <th className="px-6 py-4">Terminal</th>
                  <th className="px-6 py-4 text-right">Valor Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                      Nenhum pedido registrado no sistema.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-6 py-4 font-black text-gray-900 dark:text-white">
                        {o.orderNumber}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(o.orderDate).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {o.employeeName}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-bold">
                          {o.terminalCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-primary">
                        R$ {o.total.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Reports;
