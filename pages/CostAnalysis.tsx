import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getRecipes } from '../services/recipeService';
import { getProducts } from '../services/productService';
import { calculatePricingMetrics } from '../services/formulationEngine';
import { RECIPES as STATIC_RECIPES, PRODUCTS as STATIC_PRODUCTS } from '../constants';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface ProductCostAnalysisItem {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  multiplier: number;
  markupPct: number;
  margin: number;
  profit: number;
  hasRecipe: boolean;
  recipeType?: string;
  costPerKg?: number;
}

const CostAnalysis: React.FC = () => {
    const [sortBy, setSortBy] = useState<'margin' | 'profit' | 'multiplier'>('margin');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [analysisItems, setAnalysisItems] = useState<ProductCostAnalysisItem[]>([]);
    const [manufacturingFormulas, setManufacturingFormulas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (value: number) => {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [dbRecipes, dbProducts] = await Promise.all([
                getRecipes().catch(() => null),
                getProducts().catch(() => null)
            ]);

            const recipes = dbRecipes && dbRecipes.length > 0 ? dbRecipes : STATIC_RECIPES;
            const products = dbProducts && dbProducts.length > 0 ? dbProducts : STATIC_PRODUCTS;

            // Fórmulas de Fabricação (Calda por kg)
            const mfg = (recipes || []).filter((r: any) => r.recipe_type === 'MANUFACTURING');
            setManufacturingFormulas(mfg);

            // Análise de Produtos Comerciais (por unidade vendida)
            const commercialRecipes = (recipes || []).filter((r: any) => r.recipe_type !== 'MANUFACTURING');

            const analyzed: ProductCostAnalysisItem[] = (products || []).map((product: any) => {
                const rec = commercialRecipes.find((r: any) => r.product_id === product.id || r.productId === product.id);
                
                // Se for picolé, adiciona custo de embalagem/palito (R$ 0,14) conforme planilha
                const isPicole = product.name?.toLowerCase().includes('picolé') || product.category?.toLowerCase().includes('picolé');
                const additionalCost = isPicole ? 0.14 : 0;

                const baseCost = rec ? (Number(rec.total_cost || rec.totalCost || 0)) : (product.cost || 0);
                const totalCost = baseCost + additionalCost;
                const price = Number(product.price || 0);

                const metrics = calculatePricingMetrics(totalCost, price);

                return {
                    id: product.id,
                    name: product.name,
                    category: product.category || 'Geral',
                    cost: metrics.cost,
                    price: metrics.price,
                    multiplier: metrics.multiplier,
                    markupPct: metrics.markupPct,
                    margin: metrics.marginPct,
                    profit: metrics.profit,
                    hasRecipe: Boolean(rec),
                    recipeType: rec?.recipe_type || 'COMMERCIAL_ASSEMBLY'
                };
            });

            setAnalysisItems(analyzed);
        } catch (err) {
            console.error('Erro ao carregar análise de custos:', err);
        } finally {
            setLoading(false);
        }
    };

    // Sort products
    const sortedProducts = [...analysisItems].sort((a, b) => {
        const field = sortBy === 'multiplier' ? 'multiplier' : sortBy;
        const multiplier = sortDirection === 'desc' ? -1 : 1;
        return (a[field] - b[field]) * multiplier;
    });

    const averageMargin = analysisItems.length > 0
        ? analysisItems.reduce((sum, p) => sum + p.margin, 0) / analysisItems.length
        : 0;

    const averageMultiplier = analysisItems.length > 0
        ? analysisItems.reduce((sum, p) => sum + p.multiplier, 0) / analysisItems.length
        : 0;

    const mostProfitable = analysisItems.length > 0
        ? analysisItems.reduce((max, p) => p.profit > max.profit ? p : max)
        : null;

    const leastProfitable = analysisItems.length > 0
        ? analysisItems.reduce((min, p) => p.profit < min.profit ? p : min)
        : null;

    // Pie chart data
    const marginDistribution = [
        {
            name: 'Alta (>50%)',
            value: analysisItems.filter(p => p.margin >= 50).length,
            color: '#10b981'
        },
        {
            name: 'Média (30-50%)',
            value: analysisItems.filter(p => p.margin >= 30 && p.margin < 50).length,
            color: '#f59e0b'
        },
        {
            name: 'Baixa (<30%)',
            value: analysisItems.filter(p => p.margin < 30).length,
            color: '#ef4444'
        },
    ].filter(item => item.value > 0);

    const topProducts = [...analysisItems]
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);

    return (
        <Layout>
            <div className="p-6 lg:p-10 h-full overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Page Heading */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white font-display tracking-tight">
                                Análise de Custos & Precificação
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Análise financeira precisa discriminando <strong>Multiplicador</strong>, <strong>Markup</strong> e <strong>Margem Real</strong>, sem misturar bases de cálculo.
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
                            <p className="text-xs font-semibold text-gray-400 uppercase">Margem Média Real</p>
                            <p className="text-3xl font-black text-gray-900 dark:text-white font-mono mt-1">
                                {averageMargin.toFixed(1)}%
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">Lucro sobre preço de venda</p>
                        </div>

                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
                            <p className="text-xs font-semibold text-primary uppercase">Multiplicador Médio</p>
                            <p className="text-3xl font-black text-primary font-mono mt-1">
                                {averageMultiplier.toFixed(2)}x
                            </p>
                            <p className="text-[11px] text-gray-500 mt-1">Fator Preço / Custo</p>
                        </div>

                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
                            <p className="text-xs font-semibold text-emerald-500 uppercase">Maior Lucro Unitário</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white truncate mt-1">
                                {mostProfitable?.name || '-'}
                            </p>
                            <p className="text-xs font-mono font-bold text-emerald-600 mt-0.5">
                                +{formatCurrency(mostProfitable?.profit || 0)}/un ({mostProfitable?.margin.toFixed(1)}%)
                            </p>
                        </div>

                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
                            <p className="text-xs font-semibold text-amber-500 uppercase">Menor Margem</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white truncate mt-1">
                                {leastProfitable?.name || '-'}
                            </p>
                            <p className="text-xs font-mono font-bold text-amber-600 mt-0.5">
                                {leastProfitable?.margin.toFixed(1)}% ({formatCurrency(leastProfitable?.profit || 0)})
                            </p>
                        </div>
                    </div>

                    {/* Seção Especial: Custos de Formulação de Fábrica (Custo por kg do Mix) */}
                    {manufacturingFormulas.length > 0 && (
                        <div className="p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black font-display text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-600">science</span>
                                    Custo de Fabricação por kg de Calda (Mix Base)
                                </h3>
                                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                    Base da batelada sem embalagens de atendimento
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {manufacturingFormulas.map((f: any) => {
                                    const yieldKg = Number(f.yield || 10);
                                    const costKg = yieldKg > 0 ? Number(f.total_cost || 0) / yieldKg : 0;

                                    return (
                                        <div key={f.id} className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
                                            <p className="font-bold text-xs text-gray-900 dark:text-white">{f.name}</p>
                                            <div className="flex items-baseline justify-between mt-2">
                                                <span className="text-2xl font-black text-emerald-600 font-mono">
                                                    {formatCurrency(costKg)}/kg
                                                </span>
                                                <span className="text-[11px] text-gray-400 font-mono">
                                                    Batelada {yieldKg} kg
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Gráficos de Margem e Lucro */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Distribuição por Faixa de Margem */}
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white font-display mb-4">
                                Distribuição por Faixas de Margem Real
                            </h3>
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={marginDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {marginDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: number) => [`${val} produtos`, 'Total']}
                                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none', color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-6 mt-2 text-xs">
                                {marginDistribution.map(item => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top 5 - Lucro Unitário */}
                        <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-sm">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white font-display mb-4">
                                Top 5 - Maior Lucro Unitário em R$
                            </h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={topProducts} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={11} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none', color: '#fff' }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Bar dataKey="profit" fill="#10b981" radius={[8, 8, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Tabela Comparativa Rigorosa: Custo, Preço, Multiplicador, Markup e Margem */}
                    <div className="bg-white dark:bg-surface-dark rounded-3xl p-6 border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white font-display">
                                    Rentabilidade & Precificação por Produto Vendido
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Multiplicador (Preço/Custo) vs Markup (Adicional s/ Custo) vs Margem (Lucro s/ Preço)
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none"
                                >
                                    <option value="margin">Ordenar por Margem (%)</option>
                                    <option value="multiplier">Ordenar por Multiplicador (x)</option>
                                    <option value="profit">Ordenar por Lucro (R$)</option>
                                </select>

                                <button
                                    onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                                    className="size-9 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-black/30 border-b border-gray-200 dark:border-white/10 text-xs font-bold text-gray-400 uppercase">
                                    <tr>
                                        <th className="py-3 px-4">Produto</th>
                                        <th className="py-3 px-4">Categoria</th>
                                        <th className="py-3 px-4 text-right">Custo Unit.</th>
                                        <th className="py-3 px-4 text-right">Preço Venda</th>
                                        <th className="py-3 px-4 text-center">Multiplicador</th>
                                        <th className="py-3 px-4 text-right">Markup (%)</th>
                                        <th className="py-3 px-4 text-right">Margem Real (%)</th>
                                        <th className="py-3 px-4 text-right">Lucro Unitário</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                                    {sortedProducts.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                                            <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                                                {item.name}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-gray-500">
                                                {item.category}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono text-gray-600 dark:text-gray-300">
                                                {formatCurrency(item.cost)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                                                {formatCurrency(item.price)}
                                            </td>
                                            {/* Multiplicador inequívoco */}
                                            <td className="py-3 px-4 text-center">
                                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs">
                                                    {item.multiplier.toFixed(2)}x
                                                </span>
                                            </td>
                                            {/* Markup */}
                                            <td className="py-3 px-4 text-right font-mono text-gray-600 dark:text-gray-400 text-xs">
                                                +{item.markupPct.toFixed(1)}%
                                            </td>
                                            {/* Margem de Lucro Real */}
                                            <td className="py-3 px-4 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                                                    item.margin >= 50
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                        : item.margin >= 30
                                                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                                        : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                                }`}>
                                                    {item.margin.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-mono font-black text-gray-900 dark:text-white">
                                                {formatCurrency(item.profit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CostAnalysis;
