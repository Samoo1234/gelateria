import React from 'react';
import Layout from '../components/Layout';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { HOURLY_SALES, TOP_PRODUCTS } from '../constants';

const Dashboard: React.FC = () => {
  return (
    <Layout>
      <div className="p-6 lg:p-10 h-full overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-6 mb-10 transition-all duration-500">
            <div className="flex min-w-72 flex-col gap-2">
              <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-gray-900 dark:text-white font-display">Dashboard</h1>
              <p className="text-lg font-normal leading-normal text-gray-500 dark:text-gray-400 font-body">Visão geral das vendas e operações de hoje.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white shadow-md hover:shadow-lg transition-all duration-300 ease-fluid hover:-translate-y-1 px-5">
                <p className="text-sm font-bold leading-normal tracking-wide">Hoje</p>
              </button>
              <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-white/60 dark:bg-surface-dark/60 backdrop-blur-md px-5 border border-gray-200/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/20 hover:border-gray-300 dark:hover:border-white/30 text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md transition-all duration-300 ease-fluid">
                <p className="text-sm font-semibold leading-normal">Ontem</p>
              </button>
              <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-white/60 dark:bg-surface-dark/60 backdrop-blur-md px-5 border border-gray-200/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/20 hover:border-gray-300 dark:hover:border-white/30 text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md transition-all duration-300 ease-fluid">
                <p className="text-sm font-semibold leading-normal">Últimos 7 dias</p>
              </button>
              <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-xl bg-white/60 dark:bg-surface-dark/60 backdrop-blur-md px-5 border border-gray-200/50 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/20 hover:border-gray-300 dark:hover:border-white/30 text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md transition-all duration-300 ease-fluid">
                <span className="material-symbols-outlined text-base">calendar_month</span>
                <p className="text-sm font-semibold leading-normal">Este Mês</p>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </button>
            </div>
          </header>

          {/* Stats Cards - Liquid Glass staggered pattern */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { title: 'Vendas Totais', value: 'R$ 1.250,50', change: '+5.2%', isPositive: true },
              { title: 'Total de Pedidos', value: '83', change: '+8.1%', isPositive: true },
              { title: 'Ticket Médio', value: 'R$ 15,07', change: '-1.5%', isPositive: false },
              { title: 'Produtos Vendidos', value: '152', change: '+12%', isPositive: true },
            ].map((stat, i) => (
              <div
                key={i}
                className="group relative flex flex-col gap-3 rounded-3xl p-6 bg-white/70 dark:bg-surface-dark/70 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-glass hover:shadow-glass-hover transition-all duration-500 ease-fluid hover:-translate-y-2 overflow-hidden"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                {/* Decorative background glow on hover */}
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-3xl blur-xl"></div>

                <p className="text-sm font-semibold leading-normal text-gray-500 dark:text-gray-400 font-body tracking-wide uppercase">{stat.title}</p>
                <p className="tracking-tight text-4xl font-black leading-tight text-gray-900 dark:text-white font-display my-1">{stat.value}</p>
                <div className="flex items-center gap-1.5 mt-auto">
                  <span className={`flex items-center justify-center p-1 rounded-full ${stat.isPositive ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {stat.isPositive ? 'trending_up' : 'trending_down'}
                    </span>
                  </span>
                  <p className={`text-sm font-bold leading-normal ${stat.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* Charts Section */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Sales Chart */}
            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex w-full flex-col gap-6 rounded-3xl border border-white/40 dark:border-white/10 p-8 bg-white/70 dark:bg-surface-dark/70 backdrop-blur-xl shadow-glass transition-all duration-500 hover:shadow-glass-hover group">
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold leading-normal text-gray-900 dark:text-gray-50 font-display tracking-tight">Vendas por Hora</p>
                  <span className="material-symbols-outlined text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">bar_chart</span>
                </div>
                <div className="h-[240px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={HOURLY_SALES} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 13, fontFamily: 'Nunito Sans' }} axisLine={false} tickLine={false} dy={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                        itemStyle={{ color: '#fff', fontWeight: 600, fontFamily: 'Nunito Sans' }}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: [8, 8, 8, 8] }}
                      />
                      <Bar dataKey="sales" fill="url(#colorPrimary)" radius={[6, 6, 6, 6]} barSize={32} />
                      <defs>
                        <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Products */}
              <div className="flex w-full flex-col gap-6 rounded-3xl border border-white/40 dark:border-white/10 p-8 bg-white/70 dark:bg-surface-dark/70 backdrop-blur-xl shadow-glass transition-all duration-500 hover:shadow-glass-hover group">
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold leading-normal text-gray-900 dark:text-gray-50 font-display tracking-tight">Top Produtos</p>
                  <span className="material-symbols-outlined text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">shopping_cart</span>
                </div>
                <div className="flex flex-col justify-between h-full gap-4 pt-2">
                  {TOP_PRODUCTS.map((product, idx) => (
                    <div key={idx} className="grid gap-x-4 gap-y-2 grid-cols-[auto_1fr_auto] items-center hover:bg-gray-50/50 dark:hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-28 truncate">{product.name}</p>
                      <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800/50 flex-1 my-auto overflow-hidden border border-gray-200/50 dark:border-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${(product.sales / 100) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 w-8 text-right">{product.sales}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stock Alert Table - Soft styling */}
            <div className="xl:col-span-1 flex flex-col gap-6 rounded-3xl border border-white/40 dark:border-white/10 p-8 bg-white/70 dark:bg-surface-dark/70 backdrop-blur-xl shadow-glass transition-all duration-500 hover:shadow-glass-hover">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/10 pb-4">
                <h3 className="text-xl font-bold leading-normal text-gray-900 dark:text-gray-50 font-display tracking-tight">Estoque Baixo</h3>
                <span className="material-symbols-outlined text-cta animate-pulse">warning</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-xs uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
                    <tr>
                      <th className="py-3 px-2">Ingrediente</th>
                      <th className="py-3 px-2 text-center">Qtd.</th>
                      <th className="py-3 pl-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    <tr className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2 text-sm font-bold text-gray-800 dark:text-gray-200">Leite Condensado</td>
                      <td className="py-4 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 text-center">2 L</td>
                      <td className="py-4 pl-2 text-right flex justify-end">
                        <span className="inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                          <span className="size-2 rounded-full bg-red-500 animate-pulse"></span> Crítico
                        </span>
                      </td>
                    </tr>
                    <tr className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2 text-sm font-bold text-gray-800 dark:text-gray-200">Polpa de Morango</td>
                      <td className="py-4 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 text-center">5 Kg</td>
                      <td className="py-4 pl-2 text-right flex justify-end">
                        <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 text-xs font-bold text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30">
                          <span className="size-2 rounded-full bg-yellow-500"></span> Atenção
                        </span>
                      </td>
                    </tr>
                    <tr className="group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-2 text-sm font-bold text-gray-800 dark:text-gray-200">Granulado</td>
                      <td className="py-4 px-2 text-sm font-medium text-gray-500 dark:text-gray-400 text-center">1 Kg</td>
                      <td className="py-4 pl-2 text-right flex justify-end">
                        <span className="inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-900/20 px-3 py-1 text-xs font-bold text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                          <span className="size-2 rounded-full bg-red-500 animate-pulse"></span> Crítico
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
