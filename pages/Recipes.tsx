import React, { useState } from 'react';
import Layout from '../components/Layout';
import RecipeModal from '../components/RecipeModal';
import { useRecipes } from '../hooks/useRecipes';
import { useProducts } from '../hooks/useProducts';

const Recipes: React.FC = () => {
    const { recipes, loading, error, addRecipe } = useRecipes();
    const { products } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredRecipes = recipes.filter((recipe: any) =>
        recipe.products?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando receitas...</p>
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
            <div className="p-6 lg:p-8 h-full">
                <div className="max-w-7xl mx-auto">
                    {/* Page Heading */}
                    <div className="flex flex-wrap justify-between gap-3 p-4">
                        <div className="flex min-w-72 flex-col gap-3">
                            <p className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Receitas</p>
                            <p className="text-green-600 dark:text-green-400 text-base font-normal leading-normal">
                                Fichas técnicas com ingredientes e cálculo automático de custos.
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-3">
                        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total de Receitas</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{recipes.length}</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Produtos Cadastrados</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Custo Médio</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {recipes.length > 0 ? formatCurrency(recipes.reduce((sum: number, r: any) => sum + (r.total_cost || 0), 0) / recipes.length) : 'R$ 0,00'}
                            </p>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3">
                        <div className="flex items-center gap-2 relative">
                            <span className="material-symbols-outlined absolute left-3 text-gray-500">search</span>
                            <input
                                className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                                placeholder="Buscar receita..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-primary text-gray-900 dark:text-black gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4 hover:opacity-90 transition-opacity"
                        >
                            <span className="material-symbols-outlined fill">add</span>
                            <span className="truncate">Nova Receita</span>
                        </button>
                    </div>

                    {/* Recipes List */}
                    <div className="px-4 py-6 space-y-4">
                        {filteredRecipes.length === 0 ? (
                            <div className="bg-white dark:bg-surface-dark rounded-xl p-8 text-center border border-gray-200 dark:border-white/10">
                                <p className="text-gray-500 dark:text-gray-400">Nenhuma receita encontrada</p>
                            </div>
                        ) : (
                            filteredRecipes.map((recipe: any) => {
                                const product = recipe.products || getProductById(recipe.product_id);
                                const margin = product ? calculateMargin(recipe.total_cost || 0, product.price) : 0;
                                const isExpanded = expandedRecipe === recipe.id;

                                return (
                                    <div
                                        key={recipe.id}
                                        className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden"
                                    >
                                        {/* Recipe Header */}
                                        <div
                                            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                            onClick={() => toggleExpand(recipe.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    {product && (
                                                        <img
                                                            src={product.image_url || product.image}
                                                            alt={product.name}
                                                            className="w-16 h-16 rounded-lg object-cover"
                                                        />
                                                    )}
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                            {product?.name || recipe.productName}
                                                        </h3>
                                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                            <span className="flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-base">restaurant</span>
                                                                {recipe.recipe_items?.length || 0} ingredientes
                                                            </span>
                                                            {recipe.prep_time && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-base">schedule</span>
                                                                    {recipe.prep_time} min
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Custo</p>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                            {formatCurrency(recipe.total_cost || 0)}
                                                        </p>
                                                    </div>
                                                    {product && (
                                                        <div className="text-right">
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">Preço</p>
                                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                                {formatCurrency(product.price)}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Margem</p>
                                                        <p className={`text-xl font-bold ${margin >= 50 ? 'text-green-600' :
                                                            margin >= 30 ? 'text-yellow-600' :
                                                                'text-red-600'
                                                            }`}>
                                                            {margin.toFixed(1)}%
                                                        </p>
                                                    </div>
                                                    <span className="material-symbols-outlined text-gray-400">
                                                        {isExpanded ? 'expand_less' : 'expand_more'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recipe Details (Expanded) */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Ingredientes:</h4>
                                                <div className="space-y-2">
                                                    {(recipe.recipe_items || []).map((item: any, index: number) => (
                                                        <div
                                                            key={index}
                                                            className="flex justify-between items-center p-3 bg-white dark:bg-surface-dark rounded-lg"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="w-6 h-6 flex items-center justify-center bg-primary/20 text-gray-900 dark:text-white rounded-full text-xs font-bold">
                                                                    {index + 1}
                                                                </span>
                                                                <span className="text-gray-900 dark:text-white font-medium">
                                                                    {item.ingredients?.name || 'Ingrediente'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-6">
                                                                <span className="text-gray-600 dark:text-gray-400">
                                                                    {item.quantity} {item.unit}
                                                                </span>
                                                                <span className="text-gray-900 dark:text-white font-semibold min-w-[80px] text-right">
                                                                    {formatCurrency(item.cost || 0)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                                                    <div className="flex gap-2">
                                                        <button className="px-4 py-2 bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border border-gray-300 dark:border-white/20">
                                                            <span className="material-symbols-outlined text-base">edit</span>
                                                        </button>
                                                        <button className="px-4 py-2 bg-white dark:bg-surface-dark text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-gray-300 dark:border-white/20">
                                                            <span className="material-symbols-outlined text-base">delete</span>
                                                        </button>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Custo Total</p>
                                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                            {formatCurrency(recipe.total_cost || (recipe.recipe_items || []).reduce((sum: number, item: any) => sum + (item.cost || 0), 0))}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Recipe Modal */}
            <RecipeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={addRecipe}
            />
        </Layout>
    );
};

export default Recipes;
