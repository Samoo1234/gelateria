import React, { useState } from 'react';
import Layout from '../components/Layout';
import RecipeModal from '../components/RecipeModal';
import { ManufacturingFormulaModal } from '../components/ManufacturingFormulaModal';
import { useRecipes } from '../hooks/useRecipes';
import { useProducts } from '../hooks/useProducts';
import {
    formatPtBrStock,
    calculateFormulation,
    diagnoseRecipe,
    extractTechnicalProfile
} from '../services/formulationEngine';
import {
    FormulationIngredientItem,
    FormulationTargets
} from '../types';

const getManufacturingMetricsAndDiagnostics = (recipe: any) => {
    if (!recipe.recipe_items) return null;
    const items: FormulationIngredientItem[] = recipe.recipe_items.map((it: any) => ({
        ingredientId: it.ingredient_id,
        ingredientName: it.ingredients?.name || 'Ingrediente',
        quantity: Number(it.quantity || 0),
        unit: it.unit,
        costPerUnit: Number(it.ingredients?.cost_per_unit || 0),
        isClosingIngredient: it.is_closing_ingredient,
        profile: extractTechnicalProfile(it.ingredients?.ingredient_technical_profiles)
    }));

    const targetWeightG = Number(recipe.target_weight_g || 10000);
    const metrics = calculateFormulation(items, targetWeightG);
    const targets: FormulationTargets = {
        targetWeightG,
        fatPct: recipe.target_fat_pct ? { target: Number(recipe.target_fat_pct), tolerance: Number(recipe.fat_tolerance_pct || 1.0) } : undefined,
        msnfPct: recipe.target_msnf_pct ? { target: Number(recipe.target_msnf_pct), tolerance: Number(recipe.msnf_tolerance_pct || 1.0) } : undefined,
        sugarPct: recipe.target_sugar_pct ? { target: Number(recipe.target_sugar_pct), tolerance: Number(recipe.sugar_tolerance_pct || 1.5) } : undefined,
        totalSolidsPct: recipe.target_total_solids_pct ? { target: Number(recipe.target_total_solids_pct), tolerance: Number(recipe.solids_tolerance_pct || 2.0) } : undefined,
        pod: recipe.target_pod ? { target: Number(recipe.target_pod), tolerance: Number(recipe.pod_tolerance || 1.5) } : undefined,
        pac: recipe.target_pac ? { target: Number(recipe.target_pac), tolerance: Number(recipe.pac_tolerance || 2.0) } : undefined,
    };
    const diagnostics = diagnoseRecipe(metrics, targets);
    return { metrics, diagnostics };
};

const Recipes: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'MANUFACTURING' | 'COMMERCIAL_ASSEMBLY'>('MANUFACTURING');
    const { recipes, loading, error, addRecipe, addManufacturingFormula, refetch } = useRecipes(activeTab);
    const { products } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
    const [isCommercialModalOpen, setIsCommercialModalOpen] = useState(false);
    const [isManufacturingModalOpen, setIsManufacturingModalOpen] = useState(false);

    const filteredRecipes = recipes.filter((recipe: any) => {
        const title = recipe.name || recipe.products?.name || '';
        return title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const formatCurrency = (value: number) => {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    const getProductById = (productId: string) => {
        return products.find((p: any) => p.id === productId);
    };

    const calculateMargin = (cost: number, price: number) => {
        if (price === 0) return 0;
        return ((price - cost) / price) * 100;
    };

    const toggleExpand = (recipeId: string) => {
        setExpandedRecipe(expandedRecipe === recipeId ? null : recipeId);
    };

    if (loading) {
        return (
            <Layout>
                <div className="p-6 lg:p-8 h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando formulações...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="p-6 lg:p-8 h-full flex items-center justify-center">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-red-500 text-6xl">error</span>
                        <p className="mt-4 text-red-600">Erro ao carregar receitas: {error.message}</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-6 lg:p-8 h-full overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Page Heading */}
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h1 className="text-gray-900 dark:text-white text-4xl font-black font-display tracking-tight">
                                Formulação & Fichas Técnicas
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                Separação estrita entre <strong>Fórmulas de Fabricação</strong> (caldas de gelato/picolé/açaí) e <strong>Fichas de Venda</strong> (montagem no balcão).
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {activeTab === 'MANUFACTURING' ? (
                                <button
                                    onClick={() => setIsManufacturingModalOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-gray-900 dark:text-black text-sm font-black tracking-wide hover:opacity-90 shadow-md transition-all"
                                >
                                    <span className="material-symbols-outlined text-xl">science</span>
                                    <span>Nova Fórmula de Fabricação</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsCommercialModalOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-gray-900 dark:text-black text-sm font-black tracking-wide hover:opacity-90 shadow-md transition-all"
                                >
                                    <span className="material-symbols-outlined text-xl">add</span>
                                    <span>Nova Ficha de Venda</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Abas Arquiteturais: Fabricação vs Montagem Comercial */}
                    <div className="flex border-b border-gray-200 dark:border-white/10 gap-6">
                        <button
                            onClick={() => {
                                setActiveTab('MANUFACTURING');
                                setExpandedRecipe(null);
                            }}
                            className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                                activeTab === 'MANUFACTURING'
                                    ? 'border-primary text-gray-900 dark:text-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">science</span>
                            Fórmulas de Fabricação (Mix, Base & Picolés)
                            <span className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary font-mono">
                                Produção
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                setActiveTab('COMMERCIAL_ASSEMBLY');
                                setExpandedRecipe(null);
                            }}
                            className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                                activeTab === 'COMMERCIAL_ASSEMBLY'
                                    ? 'border-primary text-gray-900 dark:text-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">point_of_sale</span>
                            Fichas de Venda / Montagem (Balcão)
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-mono">
                                6 Fichas Ativas
                            </span>
                        </button>
                    </div>

                    {/* Banner Informativo da Arquitetura */}
                    {activeTab === 'MANUFACTURING' ? (
                        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 flex items-start gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-xl mt-0.5">precision_manufacturing</span>
                            <div>
                                <p className="font-bold text-sm">Fórmulas Físico-Químicas Elegíveis para Bateladas</p>
                                <p className="mt-0.5 opacity-90">
                                    Estas fórmulas definem a calda líquida produzida no pasteurizador ou maturador (com cálculo rigoroso de Gordura, Sólidos, ESDL, POD e PAC). <strong>Apenas estas fórmulas aparecem no seletor de Nova Ordem de Produção</strong>. Embalagens de serviço como casquinhas ou copos plásticos não entram aqui.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 flex items-start gap-3 text-xs text-blue-800 dark:text-blue-300">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl mt-0.5">info</span>
                            <div>
                                <p className="font-bold text-sm">Fichas de Montagem e Serviço Comercial</p>
                                <p className="mt-0.5 opacity-90">
                                    Estas fichas representam o produto unitário servido ao cliente final (ex: 1 Casquinha de Chocolate = 1 porção de gelato + 1 casquinha pequena). <strong>Elas não devem ser multiplicadas como batelada de fábrica</strong>, pois casquinhas e descartáveis pertencem à montagem de venda.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Toolbar & Busca */}
                    <div className="flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-2 relative flex-1 max-w-md">
                            <span className="material-symbols-outlined absolute left-3 text-gray-500">search</span>
                            <input
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-white/20 rounded-xl bg-white dark:bg-surface-dark text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                                placeholder={activeTab === 'MANUFACTURING' ? 'Buscar fórmula de calda...' : 'Buscar ficha de produto comercial...'}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="text-xs text-gray-500 font-mono">
                            Exibindo {filteredRecipes.length} itens cadastrados
                        </div>
                    </div>

                    {/* Lista de Receitas / Fórmulas */}
                    <div className="space-y-4">
                        {filteredRecipes.length === 0 ? (
                            <div className="bg-white dark:bg-surface-dark rounded-2xl p-12 text-center border border-gray-200 dark:border-white/10">
                                <span className="material-symbols-outlined text-gray-400 text-5xl">folder_off</span>
                                <p className="mt-3 text-gray-700 dark:text-gray-300 font-bold">Nenhum item cadastrado nesta categoria</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {activeTab === 'MANUFACTURING'
                                        ? 'Cadastre uma fórmula técnica de fabricação clicando no botão acima.'
                                        : 'Nenhuma ficha comercial encontrada com o termo pesquisado.'}
                                </p>
                            </div>
                        ) : (
                            filteredRecipes.map((recipe: any) => {
                                const product = recipe.products || getProductById(recipe.product_id);
                                const isExpanded = expandedRecipe === recipe.id;
                                const isManufacturing = recipe.recipe_type === 'MANUFACTURING';
                                const yieldKg = Number(recipe.yield || (isManufacturing ? 10 : 1));
                                const analysis = isManufacturing ? getManufacturingMetricsAndDiagnostics(recipe) : null;
                                const calculatedMassKg = isManufacturing && analysis?.metrics && analysis.metrics.totalMassG > 0
                                    ? analysis.metrics.totalMassG / 1000
                                    : yieldKg;
                                const costPerKg = isManufacturing && calculatedMassKg > 0 ? (recipe.total_cost || 0) / calculatedMassKg : 0;
                                const margin = product ? calculateMargin(recipe.total_cost || 0, product.price) : 0;

                                return (
                                    <div
                                        key={recipe.id}
                                        className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden transition-all"
                                    >
                                        {/* Recipe Header */}
                                        <div
                                            className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                            onClick={() => toggleExpand(recipe.id)}
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 flex-1 min-w-[280px]">
                                                    <div className={`size-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                                                        isManufacturing ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-primary/20 text-primary'
                                                    }`}>
                                                        <span className="material-symbols-outlined">
                                                            {isManufacturing ? 'science' : 'icecream'}
                                                        </span>
                                                    </div>

                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
                                                                {recipe.name || product?.name || 'Fórmula de Fabricação'}
                                                            </h3>
                                                            {isManufacturing ? (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">
                                                                    {recipe.base_type === 'WATER' ? 'Base Água / Sorbet' : 'Base Láctea'}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-medium">
                                                                    Ficha de Balcão (1 un)
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1 font-mono">
                                                                <span className="material-symbols-outlined text-sm">scale</span>
                                                                {isManufacturing ? `${yieldKg} kg rendimento` : '1 porção servida'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">inventory_2</span>
                                                                {recipe.recipe_items?.length || 0} insumos
                                                            </span>
                                                            {recipe.prep_time && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                                                    {recipe.prep_time} min
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Metrics / Indicators */}
                                                <div className="flex items-center gap-6">
                                                    {isManufacturing ? (
                                                        <>
                                                            <div className="text-right">
                                                                <p className="text-[11px] text-gray-400 uppercase font-semibold">Custo da Batelada</p>
                                                                <p className="text-base font-black text-gray-900 dark:text-white font-mono">
                                                                    {formatCurrency(recipe.total_cost || 0)}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[11px] text-primary uppercase font-semibold">
                                                                    Custo / kg {isManufacturing && calculatedMassKg > 0 ? `(massa real: ${formatPtBrStock(calculatedMassKg, 'kg', true)})` : ''}
                                                                </p>
                                                                <p className="text-xl font-black text-primary font-mono">
                                                                    {formatCurrency(costPerKg)}/kg
                                                                </p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="text-right">
                                                                <p className="text-[11px] text-gray-400 uppercase font-semibold">Custo Servido</p>
                                                                <p className="text-base font-black text-gray-900 dark:text-white font-mono">
                                                                    {formatCurrency(recipe.total_cost || 0)}
                                                                </p>
                                                            </div>
                                                            {product && (
                                                                <div className="text-right">
                                                                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Preço Venda</p>
                                                                    <p className="text-base font-black text-gray-900 dark:text-white font-mono">
                                                                        {formatCurrency(product.price)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            <div className="text-right">
                                                                <p className="text-[11px] text-gray-400 uppercase font-semibold">Margem</p>
                                                                <p className={`text-xl font-black font-mono ${
                                                                    margin >= 50 ? 'text-emerald-500' : margin >= 30 ? 'text-amber-500' : 'text-red-500'
                                                                }`}>
                                                                    {margin.toFixed(1)}%
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}

                                                    <span className="material-symbols-outlined text-gray-400">
                                                        {isExpanded ? 'expand_less' : 'expand_more'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recipe Details (Expanded) */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/5 p-5 space-y-4">
                                                {/* Se for fabricação, mostra tabela comparativa completa de Resultados Reais vs Metas */}
                                                {isManufacturing && (() => {
                                                    const analysis = getManufacturingMetricsAndDiagnostics(recipe);
                                                    if (!analysis) return null;
                                                    const { metrics, diagnostics } = analysis;

                                                    return (
                                                        <div className="space-y-3">
                                                            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-white/10 text-xs">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-primary text-base">scale</span>
                                                                    <span className="text-gray-600 dark:text-gray-300">Massa Real dos Insumos:</span>
                                                                    <strong className="font-mono text-gray-900 dark:text-white">
                                                                        {formatPtBrStock(metrics.totalMassG / 1000, 'kg', true)}
                                                                    </strong>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-gray-500">Massa Alvo Planejada:</span>
                                                                    <strong className="font-mono text-gray-700 dark:text-gray-300">
                                                                        {formatPtBrStock((recipe.target_weight_g || 10000) / 1000, 'kg', true)}
                                                                    </strong>
                                                                </div>
                                                                <div className="flex items-center gap-2 font-mono text-xs">
                                                                    <span className="text-gray-500">Desvio Real:</span>
                                                                    <strong className={`font-bold ${
                                                                        metrics.isBalanced ? 'text-emerald-600' : 'text-amber-600 dark:text-amber-400'
                                                                    }`}>
                                                                        {metrics.totalMassG >= (recipe.target_weight_g || 10000) ? '+' : ''}
                                                                        {((metrics.totalMassG - (recipe.target_weight_g || 10000)) / 1000).toFixed(3).replace('.', ',')} kg
                                                                    </strong>
                                                                </div>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                    metrics.isBalanced
                                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                                                }`}>
                                                                    {metrics.isBalanced ? '✓ Massa Balanceada' : '⚠️ Desvio de Massa Detectado'}
                                                                </span>
                                                            </div>

                                                            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                                                                <table className="w-full text-left text-xs bg-white dark:bg-surface-dark">
                                                                    <thead className="bg-gray-100/70 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                                                        <tr>
                                                                            <th className="p-2.5">Parâmetro Físico-Químico</th>
                                                                            <th className="p-2.5">Meta</th>
                                                                            <th className="p-2.5">Real Calculado</th>
                                                                            <th className="p-2.5">Diferença (Δ)</th>
                                                                            <th className="p-2.5">Tolerância</th>
                                                                            <th className="p-2.5 text-right">Estado</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-mono">
                                                                        {diagnostics.map((d, dIdx) => (
                                                                            <tr key={dIdx} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                                                <td className="p-2.5 font-sans font-medium text-gray-800 dark:text-gray-200">
                                                                                    {d.parameter}
                                                                                </td>
                                                                                <td className="p-2.5 text-gray-500">{d.target}</td>
                                                                                <td className="p-2.5 font-bold text-gray-900 dark:text-white">
                                                                                    {d.actual}
                                                                                </td>
                                                                                <td className={`p-2.5 font-bold ${
                                                                                    d.status === 'OPTIMAL' ? 'text-emerald-600' :
                                                                                    d.status === 'ACCEPTABLE' ? 'text-blue-600' :
                                                                                    'text-red-500'
                                                                                }`}>
                                                                                    {d.deviation > 0 ? `+${d.deviation}` : d.deviation}
                                                                                </td>
                                                                                <td className="p-2.5 text-gray-400">±{d.tolerance}</td>
                                                                                <td className="p-2.5 text-right font-sans">
                                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                                        d.status === 'OPTIMAL'
                                                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                                                            : d.status === 'ACCEPTABLE'
                                                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                                                                            : d.status === 'PENDING'
                                                                                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                                                                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                                                                    }`}>
                                                                                        {d.status === 'OPTIMAL' ? 'Excelente' :
                                                                                         d.status === 'ACCEPTABLE' ? 'Dentro da Meta' :
                                                                                         d.status === 'PENDING' ? 'Pendente' :
                                                                                         'Fora da Tolerância'}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                    {isManufacturing ? 'Composição do Mix da Batelada:' : 'Itens Consumidos no Atendimento / Venda:'}
                                                </h4>

                                                <div className="space-y-2">
                                                    {(recipe.recipe_items || []).map((item: any, index: number) => {
                                                        const isClosing = item.is_closing_ingredient;
                                                        const ingName = item.ingredients?.name || 'Ingrediente';

                                                        return (
                                                            <div
                                                                key={index}
                                                                className={`flex justify-between items-center p-3 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-white/5 text-xs ${
                                                                    isClosing ? 'border-primary/40 bg-primary/5' : ''
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span className="size-6 flex items-center justify-center bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-full font-bold text-[10px]">
                                                                        {index + 1}
                                                                    </span>
                                                                    <div>
                                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                                            {ingName}
                                                                        </span>
                                                                        {isClosing && (
                                                                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                                                                                Fechamento de Peso
                                                                            </span>
                                                                        )}
                                                                        {isManufacturing && (() => {
                                                                            const profile = extractTechnicalProfile(item.ingredients?.ingredient_technical_profiles);
                                                                            const status = profile?.data_status;
                                                                            if (status === 'CONFIRMED') {
                                                                                return (
                                                                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold">
                                                                                        ✓ Homologado
                                                                                    </span>
                                                                                );
                                                                            } else if (status === 'ESTIMATED') {
                                                                                return (
                                                                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium">
                                                                                        Estimado (TACO/Planilha)
                                                                                    </span>
                                                                                );
                                                                            } else {
                                                                                return (
                                                                                    <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 font-medium">
                                                                                        Pendente
                                                                                    </span>
                                                                                );
                                                                            }
                                                                        })()}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-6">
                                                                    <span className="font-mono text-gray-600 dark:text-gray-400 font-bold">
                                                                        {formatPtBrStock(item.quantity, item.unit)}
                                                                    </span>
                                                                    <span className="text-gray-900 dark:text-white font-mono font-bold min-w-[80px] text-right">
                                                                        {formatCurrency(item.cost || 0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {recipe.notes && (
                                                    <p className="text-xs text-gray-500 italic pt-2">
                                                        Observações: {recipe.notes}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Ficha Comercial Simples */}
            <RecipeModal
                isOpen={isCommercialModalOpen}
                onClose={() => setIsCommercialModalOpen(false)}
                onSave={addRecipe}
            />

            {/* Modal Especializada de Formulação Técnica */}
            <ManufacturingFormulaModal
                isOpen={isManufacturingModalOpen}
                onClose={() => setIsManufacturingModalOpen(false)}
                onSaved={refetch}
                products={products}
                onSaveFormula={addManufacturingFormula}
            />
        </Layout>
    );
};

export default Recipes;
