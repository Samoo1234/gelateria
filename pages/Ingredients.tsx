import React, { useState } from 'react';
import Layout from '../components/Layout';
import { INGREDIENTS } from '../constants';
import { Ingredient } from '../types';

const Ingredients: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

    const categories = ['all', 'Laticínios', 'Frutas/Polpas', 'Secos', 'Químicos', 'Embalagens', 'Outros'];

    const filteredIngredients = INGREDIENTS.filter(ing => {
        const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ing.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || ing.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleEdit = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingIngredient(null);
        setShowModal(true);
    };

    const formatCurrency = (value: number) => {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    };

    const getUnitLabel = (unit: string) => {
        const labels: Record<string, string> = {
            'kg': 'Kg',
            'g': 'g',
            'L': 'Litro',
            'ml': 'ml',
            'un': 'Unidade'
        };
        return labels[unit] || unit;
    };

    return (
        <Layout>
            <div className="p-6 lg:p-8 h-full">
                <div className="max-w-7xl mx-auto">
                    {/* Page Heading */}
                    <div className="flex flex-wrap justify-between gap-3 p-4">
                        <div className="flex min-w-72 flex-col gap-3">
                            <p className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Ingredientes</p>
                            <p className="text-green-600 dark:text-green-400 text-base font-normal leading-normal">
                                Gerencie matérias-primas e seus custos para calcular o preço dos produtos.
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat
                                            ? 'bg-primary text-gray-900 dark:text-black'
                                            : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                                        }`}
                                >
                                    {cat === 'all' ? 'Todos' : cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3">
                        <div className="flex items-center gap-2 relative">
                            <span className="material-symbols-outlined absolute left-3 text-gray-500">search</span>
                            <input
                                className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                                placeholder="Buscar ingrediente..."
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleAdd}
                            className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-primary text-gray-900 dark:text-black gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4 hover:opacity-90 transition-opacity"
                        >
                            <span className="material-symbols-outlined fill">add</span>
                            <span className="truncate">Adicionar Ingrediente</span>
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-4 py-3">
                        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Total de Ingredientes</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{INGREDIENTS.length}</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Laticínios</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {INGREDIENTS.filter(i => i.category === 'Laticínios').length}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Frutas/Polpas</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {INGREDIENTS.filter(i => i.category === 'Frutas/Polpas').length}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-200 dark:border-white/10">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Embalagens</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {INGREDIENTS.filter(i => i.category === 'Embalagens').length}
                            </p>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="px-4 py-6">
                        <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-white/10">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-white/5">
                                        <tr>
                                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Nome</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Categoria</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Unidade</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Custo/Unidade</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Fornecedor</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                        {filteredIngredients.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                    Nenhum ingrediente encontrado
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredIngredients.map(ingredient => (
                                                <tr key={ingredient.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                    <td className="p-4 text-gray-900 dark:text-white font-medium">{ingredient.name}</td>
                                                    <td className="p-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-gray-900 dark:text-white">
                                                            {ingredient.category}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-gray-700 dark:text-gray-300">{getUnitLabel(ingredient.unit)}</td>
                                                    <td className="p-4 text-gray-900 dark:text-white font-semibold">
                                                        {formatCurrency(ingredient.costPerUnit)}/{ingredient.unit}
                                                    </td>
                                                    <td className="p-4 text-gray-700 dark:text-gray-300">{ingredient.supplier || '-'}</td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEdit(ingredient)}
                                                                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full"
                                                            >
                                                                <span className="material-symbols-outlined text-base">edit</span>
                                                            </button>
                                                            <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full">
                                                                <span className="material-symbols-outlined text-base">delete</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Modal placeholder - will be functional with state management */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white dark:bg-surface-dark rounded-xl max-w-md w-full p-6 shadow-xl">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                    {editingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Funcionalidade de edição será implementada com gerenciamento de estado.
                                </p>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full bg-primary text-gray-900 dark:text-black py-2 rounded-lg font-medium hover:opacity-90"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Ingredients;
