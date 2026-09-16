import React, { useState } from 'react';
import Layout from '../components/Layout';
import { RECIPES, PRODUCTS } from '../constants';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CostAnalysis: React.FC = () => {
    const [sortBy, setSortBy] = useState<'margin' | 'profit'>('margin');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const formatCurrency = (value: number) => {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    const calculateMargin = (cost: number, price: number) => {
        if (price === 0) return 0;
        return ((price - cost) / price) * 100;
    };

    // Build product analysis data
    const productAnalysis = RECIPES.map(recipe => {
        const product = PRODUCTS.find(p => p.id === recipe.productId);
        if (!product) return null;

        const cost = recipe.totalCost || 0;
        const price = product.price;
        const margin = calculateMargin(cost, price);
        const profit = price - cost;

        return {
            id: product.id,
            name: product.name,
            category: product.category,
            cost,
            price,
            margin,
            profit,
            hasRecipe: true,
        };
    }).filter(Boolean);

    // Add products without recipes
    const productsWithoutRecipes = PRODUCTS.filter(
        p => !RECIPES.find(r => r.productId === p.id)
    ).map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        cost: 0,
        price: product.price,
        margin: 0,
        profit: 0,
        hasRecipe: false,
    }));

    const allProducts = [...productAnalysis, ...productsWithoutRecipes];

    // Sort products
    const sortedProducts = [...productAnalysis].sort((a, b) => {
        const field = sortBy;
        const multiplier = sortDirection === 'desc' ? -1 : 1;
        return (a[field] - b[field]) * multiplier;
    });

    // Calculate statistics
    const totalProducts = PRODUCTS.length;
    const productsWithRecipe = RECIPES.length;
    const productsWithoutRecipe = totalProducts - productsWithRecipe;
    const averageMargin = productAnalysis.length > 0
        ? productAnalysis.reduce((sum, p) => sum + p.margin, 0) / productAnalysis.length
        : 0;

    const mostProfitable = productAnalysis.length > 0
        ? productAnalysis.reduce((max, p) => p.profit > max.profit ? p : max)
        : null;

    const leastProfitable = productAnalysis.length > 0
        ? productAnalysis.reduce((min, p) => p.profit < min.profit ? p : min)
        : null;

    // Pie chart data for margin distribution
    const marginDistribution = [
        {
            name: 'Alta (>50%)',
            value: productAnalysis.filter(p => p.margin >= 50).length,
            color: '#10b981'
        },
        {
            name: 'Média (30-50%)',
            value: productAnalysis.filter(p => p.margin >= 30 && p.margin < 50).length,
            color: '#f59e0b'
        },
        {
            name: 'Baixa (<30%)',
            value: productAnalysis.filter(p => p.margin < 30).length,
            color: '#ef4444'
        },
    ].filter(item => item.value > 0);

    // Bar chart data for top products
    const topProducts = [...productAnalysis]
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);

    const bottomProducts = [...productAnalysis]
        .sort((a, b) => a.margin - b.margin)
        .slice(0, 5);

    return (
        <Layout>
            <div className="p-6 lg:p-10 h-full overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Page Heading */}
                    <div className="flex flex-wrap items-center justify-between gap-6 mb-10 transition-all duration-500">
                        <div className="flex min-w-72 flex-col gap-2">
                            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-gray-900 dark:text-white font-display">Análise de Custos</h1>
                            <p className="text-lg font-normal leading-normal text-gray-500 dark:text-gray-400 font-body">
                                Análise de rentabilidade e custos por produto.
                            </p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="group relative bg-white/70 dark:bg-surface-dark/70 rounded-3xl p-6 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-glass hover:shadow-glass-hover transition-all duration-500 ease-fluid hover:-translate-y-2 overflow-hidden">
                            <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-3xl blur-xl"></div>
                            <p className="text-sm font-semibold leading-normal text-gray-500 dark:text-gray-400 font-body tracking-wide uppercase">Total de Produtos</p>
                            <p className="tracking-tight text-4xl font-black leading-tight text-gray-900 dark:text-white font-display my-1">{totalProducts}</p>
                            <p className="text-sm font-medium text-gray-400 mt-auto">{productsWithRecipe} com receita</p>
                        </div>
                        <div className="group relative bg-white/70 dark:bg-surface-dark/70 rounded-3xl p-6 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-glass hover:shadow-glass-hover transition-all duration-500 ease-fluid hover:-translate-y-2 overflow-hidden">
                            <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-3xl blur-xl"></div>
                            <p className="text-sm font-semibold leading-normal text-gray-500 dark:text-gray-400 font-body tracking-wide uppercase">Margem Média</p>
                            <p className="tracking-tight text-4xl font-black leading-tight text-green-600 dark:text-green-500 font-display my-1">{averageMargin.toFixed(1)}%</p>
                        </div>
                        <div className="group relative bg-white/70 dark:bg-surface-dark/70 rounded-3xl p-6 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-glass hover:shadow-glass-hover transition-all duration-500 ease-fluid hover:-translate-y-2 overflow-hidden">
                            <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-3xl blur-xl"></div>
                            <p className="text-sm font-semibold leading-normal text-gray-500 dark:text-gray-400 font-body tracking-wide uppercase">Mais Rentável</p>
                            <p className="tracking-tight text-2xl font-bold leading-tight text-gray-900 dark:text-white font-display my-1 truncate">
                                {mostProfitable?.name || '-'}
                            </p>
                            <p className="text-sm font-bold text-green-600 mt-auto">
                                {mostProfitable ? `${mostProfitable.margin.toFixed(1)}%` : ''}
                            </p>
                        </div>
                        <div className="group relative bg-white/70 dark:bg-surface-dark/70 rounded-3xl p-6 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-glass hover:shadow-glass-hover transition-all duration-500 ease-fluid hover:-translate-y-2 overflow-hidden">
                            <div className="absolute -inset-4 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-3xl blur-xl"></div>
                            <p className="text-sm font-semibold leading-normal text-gray-500 dark:text-gray-400 font-body tracking-wide uppercase">Menos Rentável</p>
                            <p className="tracking-tight text-2xl font-bold leading-tight text-gray-900 dark:text-white font-display my-1 truncate">
                                {leastProfitable?.name || '-'}
                            </p>
                            <p className="text-sm font-bold text-red-600 mt-auto">
                                {leastProfitable ? `${leastProfitable.margin.toFixed(1)}%` : ''}
                            </p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        {/* Pie Chart - Margin Distribution */}
                        <div className="bg-white/70 dark:bg-surface-dark/70 rounded-3xl p-8 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-glass hover:shadow-glass-hover transition-all duration-500 group">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold leading-normal text-gray-900 dark:text-gray-50 font-display tracking-tight">Distribuição de Margem</h3>
                                <span className="material-symbols-outlined text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">pie_chart</span>
                            </div>
                            {marginDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={marginDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={90}
                                            innerRadius={60}
                                            fill="#8884d8"
                                            dataKey="value"
                                            paddingAngle={5}
                                        >
                                            {marginDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                                            itemStyle={{ color: '#fff', fontWeight: 600, fontFamily: 'Nunito Sans' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-12 font-medium">
                                    Sem dados de margem disponíveis
                                </p>
                            )}
                        </div>

                        {/* Bar Chart - Top Products */}
                        <div className="bg-white/70 dark:bg-surface-dark/70 rounded-3xl p-8 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-glass hover:shadow-glass-hover transition-all duration-500 group">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold leading-normal text-gray-900 dark:text-gray-50 font-display tracking-tight">Top 5 - Lucro Unitário</h3>
                                <span className="material-symbols-outlined text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">bar_chart</span>
                            </div>
                            {topProducts.length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={topProducts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={13} fontFamily="Nunito Sans" axisLine={false} tickLine={false} dy={10} />
                                        <YAxis stroke="#9ca3af" fontSize={13} fontFamily="Nunito Sans" axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                                            labelStyle={{ color: '#fff', fontWeight: 600, fontFamily: 'Nunito Sans' }}
                                            cursor={{ fill: 'rgba(16, 185, 129, 0.05)', radius: [8, 8, 8, 8] }}
                                            formatter={(value: number) => formatCurrency(value)}
                                        />
                                        <Bar dataKey="profit" fill="url(#colorProfit)" radius={[6, 6, 6, 6]} barSize={40} />
                                        <defs>
                                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-12 font-medium">
                                    Sem dados disponíveis
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Rentability Table */}
                    <div className="px-4 py-6 mb-10">
                        <div className="bg-white/70 dark:bg-surface-dark/70 rounded-3xl p-6 border border-white/40 dark:border-white/10 backdrop-blur-xl shadow-glass transition-all duration-500 overflow-hidden group">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold leading-normal text-gray-900 dark:text-gray-50 font-display tracking-tight">Rentabilidade</h3>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as 'margin' | 'profit')}
                                            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer backdrop-blur-sm"
                                        >
                                            <option value="margin">Ordenar por Margem</option>
                                            <option value="profit">Ordenar por Lucro</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_content</span>
                                    </div>
                                    <button
                                        onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                                        className="w-11 h-11 flex items-center justify-center rounded-xl border border-gray-200/50 dark:border-white/10 bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/10 transition-all cursor-pointer backdrop-blur-sm shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-xl transition-transform duration-300">
                                            {sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto -mx-6 px-6">
                                <table className="w-full text-left border-separate border-spacing-y-2">
                                    <thead className="text-xs uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3">Produto</th>
                                            <th className="px-4 py-3">Categoria</th>
                                            <th className="px-4 py-3">Custo</th>
                                            <th className="px-4 py-3">Preço</th>
                                            <th className="px-4 py-3">Margem</th>
                                            <th className="px-4 py-3 text-right">Lucro Unit.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedProducts.map(product => (
                                            <tr key={product.id} className="group bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors backdrop-blur-sm rounded-xl">
                                                <td className="px-4 py-4 text-gray-900 dark:text-white font-bold rounded-l-xl">{product.name}</td>
                                                <td className="px-4 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400">{product.category}</td>
                                                <td className="px-4 py-4 text-gray-700 dark:text-gray-300 font-semibold">
                                                    {formatCurrency(product.cost)}
                                                </td>
                                                <td className="px-4 py-4 text-gray-700 dark:text-gray-300 font-semibold">
                                                    {formatCurrency(product.price)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${product.margin >= 50 ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30' :
                                                        product.margin >= 30 ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800/30' :
                                                            'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30'
                                                        }`}>
                                                        {product.margin.toFixed(1)}%
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-gray-900 dark:text-white font-black text-right rounded-r-xl">
                                                    {formatCurrency(product.profit)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Alerts/Suggestions */}
                    {productsWithoutRecipe > 0 && (
                        <div className="px-4 py-4">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">warning</span>
                                    <div>
                                        <h4 className="font-semibold text-yellow-900 dark:text-yellow-300">
                                            Produtos sem receita cadastrada
                                        </h4>
                                        <p className="text-sm text-yellow-800 dark:text-yellow-400 mt-1">
                                            Existem {productsWithoutRecipe} produtos sem ficha técnica. Cadastre as receitas para calcular custos e margens.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {bottomProducts.some(p => p.margin < 30) && (
                        <div className="px-4 py-4">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
                                    <div>
                                        <h4 className="font-semibold text-red-900 dark:text-red-300">
                                            Produtos com margem baixa
                                        </h4>
                                        <p className="text-sm text-red-800 dark:text-red-400 mt-1">
                                            Os seguintes produtos têm margem abaixo de 30%: {bottomProducts.filter(p => p.margin < 30).map(p => p.name).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default CostAnalysis;
