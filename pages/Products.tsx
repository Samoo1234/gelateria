import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useProducts } from '../hooks/useProducts';
import { useRecipes } from '../hooks/useRecipes';
import { NavLink } from 'react-router-dom';

const Products: React.FC = () => {
  const { products, loading, error } = useProducts();
  const { recipes } = useRecipes();
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const getRecipeForProduct = (productId: string) => {
    return recipes.find((r: any) => r.product_id === productId);
  };

  const calculateMargin = (cost: number, price: number) => {
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  // Filter products
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="p-6 lg:p-8 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando produtos...</p>
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
            <p className="mt-4 text-red-600">Erro ao carregar produtos: {error.message}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 h-full">
        <div className="max-w-7xl mx-auto">
          {/* PageHeading */}
          <div className="flex flex-wrap justify-between gap-3 p-4">
            <div className="flex min-w-72 flex-col gap-3">
              <p className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Gerenciamento de Produtos</p>
              <p className="text-green-600 dark:text-green-400 text-base font-normal leading-normal">Adicione, edite e remova sabores, coberturas e outros itens do cardápio.</p>
            </div>
          </div>
          <div className="mt-6">
            {/* Tabs */}
            <div className="pb-3">
              <div className="flex border-b border-gray-200 dark:border-white/20 px-4 gap-8">
                <a className="flex flex-col items-center justify-center border-b-[3px] border-b-primary pb-[13px] pt-4 cursor-pointer">
                  <p className="text-gray-900 dark:text-white text-sm font-bold leading-normal tracking-[0.015em]">Sabores</p>
                </a>
                <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-green-700 dark:text-green-300/80 pb-[13px] pt-4 cursor-pointer">
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Coberturas</p>
                </a>
                <a className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-green-700 dark:text-green-300/80 pb-[13px] pt-4 cursor-pointer">
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Outros Produtos</p>
                </a>
              </div>
            </div>
            {/* ToolBar */}
            <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3">
              <div className="flex items-center gap-2 relative">
                <span className="material-symbols-outlined absolute left-3 text-gray-500">search</span>
                <input
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-surface-dark text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  placeholder="Buscar sabor..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg">
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
              </div>
              <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-primary text-gray-900 dark:text-black gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-4 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined fill">add</span>
                <span className="truncate">Adicionar Novo Sabor</span>
              </button>
            </div>
            {/* Data Table */}
            <div className="px-4 py-6">
              <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-white/10">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-white/5">
                    <tr>
                      <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Nome do Sabor</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Receita</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Custo (R$)</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Preço (R$)</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Margem</th>
                      <th className="p-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                    {filteredProducts.map(product => {
                      const recipe = getRecipeForProduct(product.id);
                      const cost = product.total_cost || 0;
                      const margin = product.margin_percentage || 0;

                      return (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="p-4 text-gray-900 dark:text-white font-medium flex items-center gap-3">
                            <img src={product.image_url || ''} alt={product.name} className="w-10 h-10 rounded-full object-cover" />
                            {product.name}
                          </td>
                          <td className="p-4">
                            {recipe ? (
                              <NavLink
                                to="/recipes"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Cadastrada
                              </NavLink>
                            ) : (
                              <NavLink
                                to="/recipes"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                              >
                                <span className="material-symbols-outlined text-sm">add_circle</span>
                                Criar receita
                              </NavLink>
                            )}
                          </td>
                          <td className="p-4 text-gray-900 dark:text-white font-semibold">
                            {recipe ? formatCurrency(cost) : '-'}
                          </td>
                          <td className="p-4 text-gray-700 dark:text-gray-300">{formatCurrency(product.price)}</td>
                          <td className="p-4">
                            {recipe ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${margin >= 50 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                margin >= 30 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                {margin.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full">
                                <span className="material-symbols-outlined text-base">edit</span>
                              </button>
                              <button className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full">
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
