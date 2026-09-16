import React from 'react';
import Layout from '../components/Layout';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PERIOD_SALES, TOP_PRODUCTS } from '../constants';

const Reports: React.FC = () => {
  return (
    <Layout>
      <div className="p-6 lg:p-8 h-full">
        <div className="mx-auto max-w-7xl">
          {/* PageHeading */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Relatórios e Análises</h1>
              <p className="text-gray-500 dark:text-gray-400">Visualize o desempenho de vendas e insights de produtos.</p>
            </div>
            <button className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined">download</span>
              Exportar para PDF
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-white/10 mb-8">
            <h3 className="text-lg font-bold tracking-tight mb-4 text-gray-900 dark:text-white">Filtros</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Período</label>
                <select className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white">
                  <option>Esta Semana</option>
                  <option>Este Mês</option>
                  <option>Hoje</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
                <select className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white">
                  <option>Todas</option>
                  <option>Sorvetes</option>
                  <option>Açaí</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Forma de Pagamento</label>
                <select className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-primary focus:border-primary text-gray-900 dark:text-white">
                  <option>Todas</option>
                  <option>Crédito</option>
                  <option>PIX</option>
                  <option>Dinheiro</option>
                </select>
              </div>
              <button className="w-full lg:w-auto h-10 px-6 rounded-lg bg-primary text-white font-semibold shadow-sm hover:bg-primary/90 transition-colors">Gerar Relatório</button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
             {[
               { title: 'Faturamento Total', value: 'R$12.450,00', trend: '+15.2%', isUp: true },
               { title: 'Total de Pedidos', value: '512', trend: '+8.5%', isUp: true },
               { title: 'Ticket Médio', value: 'R$24,32', trend: '-2.1%', isUp: false },
               { title: 'Item Mais Vendido', value: 'Chocolate Belga', sub: '87 unidades', trend: null },
             ].map((stat, i) => (
               <div key={i} className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10">
                 <p className="text-base font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                 <p className={`text-3xl font-bold text-gray-900 dark:text-white ${i === 3 ? 'text-2xl' : ''}`}>{stat.value}</p>
                 {stat.trend && (
                   <p className={`${stat.isUp ? 'text-green-600' : 'text-red-500'} text-sm font-medium flex items-center gap-1`}>
                     <span className="material-symbols-outlined text-base">{stat.isUp ? 'trending_up' : 'trending_down'}</span>{stat.trend}
                   </p>
                 )}
                 {stat.sub && <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.sub}</p>}
               </div>
             ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-3 bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-white/10">
              <h3 className="text-lg font-bold tracking-tight mb-4 text-gray-900 dark:text-white">Vendas por Período</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={PERIOD_SALES}>
                     <defs>
                       <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#2bee8c" stopOpacity={0.8}/>
                         <stop offset="95%" stopColor="#2bee8c" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <XAxis dataKey="time" axisLine={false} tickLine={false} />
                     <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                     <Area type="monotone" dataKey="sales" stroke="#2bee8c" fillOpacity={1} fill="url(#colorSales)" />
                   </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-white/10">
              <h3 className="text-lg font-bold tracking-tight mb-4 text-gray-900 dark:text-white">Top 5 Produtos</h3>
              <div className="space-y-4">
                {TOP_PRODUCTS.map((prod, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                      <p>{prod.name}</p><p>{prod.sales}</p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full" style={{ width: `${prod.sales}%`, backgroundColor: prod.color }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
