import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { useProducts } from '../hooks/useProducts';
import { useRecipes } from '../hooks/useRecipes';
import { orderService, CategoryRow } from '../services/orderService';
import { NavLink } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  PlusCircle, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  IceCream,
  Sparkles,
  Package,
  Layers
} from 'lucide-react';

type TabKey = 'sabores' | 'coberturas' | 'outros';

const Products: React.FC = () => {
  const { products, loading, error, addProduct, editProduct, removeProduct } = useProducts();
  const { recipes } = useRecipes();
  
  const [activeTab, setActiveTab] = useState<TabKey>('sabores');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category_id: '',
    is_flavor: true,
    sale_type: 'SCOOP' as 'SCOOP' | 'UNIT' | 'WEIGHT',
    description: '',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Carrega categorias reais do Supabase
  useEffect(() => {
    orderService.getCategories()
      .then(cats => setCategories(cats))
      .catch(err => console.error('Erro ao carregar categorias:', err));
  }, []);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const getRecipeForProduct = (productId: string) => {
    return recipes.find((r: any) => r.product_id === productId);
  };

  // Filtra produtos pela aba ativa e busca
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Filtro da aba
      let matchesTab = false;
      const catName = (p.category_name || '').toLowerCase();

      if (activeTab === 'sabores') {
        // Sabores: is_flavor true ou categoria Casquinha/Copo
        matchesTab = p.is_flavor === true || catName.includes('casquinha') || catName.includes('copo');
      } else if (activeTab === 'coberturas') {
        // Coberturas: categoria Coberturas ou adicionais
        matchesTab = catName.includes('cobertura') || catName.includes('adicion') || catName.includes('calda');
      } else {
        // Outros Produtos: Bebidas, Açaí, Milkshakes, etc.
        const isSabor = p.is_flavor === true || catName.includes('casquinha') || catName.includes('copo');
        const isCobertura = catName.includes('cobertura') || catName.includes('adicion') || catName.includes('calda');
        matchesTab = !isSabor && !isCobertura;
      }

      // Filtro de busca
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [products, activeTab, searchTerm]);

  // Abertura do modal para adicionar novo item
  const handleOpenAdd = () => {
    setEditingProduct(null);
    
    // Configura defaults dependendo da aba ativa
    let defaultCatId = '';
    let defaultIsFlavor = false;
    let defaultSaleType: 'SCOOP' | 'UNIT' | 'WEIGHT' = 'UNIT';

    if (activeTab === 'sabores') {
      const saborCat = categories.find(c => c.name.toLowerCase().includes('casquinha') || c.name.toLowerCase().includes('copo'));
      defaultCatId = saborCat ? saborCat.id : (categories[0]?.id || '');
      defaultIsFlavor = true;
      defaultSaleType = 'SCOOP';
    } else if (activeTab === 'coberturas') {
      const cobCat = categories.find(c => c.name.toLowerCase().includes('cobertura'));
      defaultCatId = cobCat ? cobCat.id : (categories[0]?.id || '');
      defaultIsFlavor = false;
      defaultSaleType = 'UNIT';
    } else {
      const outroCat = categories.find(c => !c.name.toLowerCase().includes('casquinha') && !c.name.toLowerCase().includes('cobertura'));
      defaultCatId = outroCat ? outroCat.id : (categories[0]?.id || '');
      defaultIsFlavor = false;
      defaultSaleType = 'UNIT';
    }

    setFormData({
      name: '',
      price: '',
      category_id: defaultCatId,
      is_flavor: defaultIsFlavor,
      sale_type: defaultSaleType,
      description: '',
      image_url: ''
    });
    setShowModal(true);
  };

  // Abertura do modal para edição
  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: Number(product.price || 0).toString(),
      category_id: product.category_id || categories[0]?.id || '',
      is_flavor: Boolean(product.is_flavor),
      sale_type: product.sale_type || 'UNIT',
      description: product.description || '',
      image_url: product.image_url || ''
    });
    setShowModal(true);
  };

  // Salvar produto (novo ou edição)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const priceNum = parseFloat(formData.price.replace(',', '.')) || 0;

    try {
      setIsSubmitting(true);
      setNotification(null);

      if (editingProduct) {
        const success = await editProduct(editingProduct.id, {
          name: formData.name.trim(),
          price: priceNum,
          category_id: formData.category_id || null,
          is_flavor: formData.is_flavor,
          sale_type: formData.sale_type,
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null
        });
        if (success) {
          setNotification({ text: 'Produto atualizado com sucesso!', type: 'success' });
        } else {
          setNotification({ text: 'Erro ao atualizar produto.', type: 'error' });
        }
      } else {
        const success = await addProduct({
          name: formData.name.trim(),
          price: priceNum,
          category_id: formData.category_id || null,
          is_flavor: formData.is_flavor,
          sale_type: formData.sale_type,
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null,
          is_active: true
        });
        if (success) {
          setNotification({ text: 'Produto cadastrado com sucesso!', type: 'success' });
        } else {
          setNotification({ text: 'Erro ao cadastrar produto.', type: 'error' });
        }
      }

      setShowModal(false);
    } catch (err: any) {
      setNotification({ text: err.message || 'Falha ao salvar produto.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exclusão / Desativação
  const handleDelete = async (productId: string, productName: string) => {
    if (confirm(`Deseja desativar o produto "${productName}"?`)) {
      try {
        const success = await removeProduct(productId);
        if (success) {
          setNotification({ text: `Produto "${productName}" removido com sucesso.`, type: 'success' });
        } else {
          setNotification({ text: 'Erro ao remover produto.', type: 'error' });
        }
      } catch (err: any) {
        setNotification({ text: err.message || 'Erro ao remover.', type: 'error' });
      }
    }
  };

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

  // Label dinâmico para o botão de adicionar
  const addButtonLabel = activeTab === 'sabores' 
    ? 'Adicionar Novo Sabor' 
    : activeTab === 'coberturas' 
    ? 'Adicionar Nova Cobertura' 
    : 'Adicionar Novo Produto';

  return (
    <Layout>
      <div className="p-6 lg:p-8 h-full">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* PageHeading */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-gray-900 dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
                Gerenciamento de Produtos
              </h1>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                Adicione, edite e gerencie sabores, coberturas, açaí, milk-shakes e bebidas do cardápio.
              </p>
            </div>
          </div>

          {/* Notificação */}
          {notification && (
            <div className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-bold ${
              notification.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300'
            }`}>
              {notification.type === 'error' ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
              <span>{notification.text}</span>
            </div>
          )}

          {/* Tabs Funcionais */}
          <div className="border-b border-gray-200 dark:border-white/10">
            <div className="flex px-2 gap-6">
              <button
                onClick={() => setActiveTab('sabores')}
                className={`flex items-center gap-2 border-b-[3px] pb-3 pt-2 font-bold text-sm transition-all cursor-pointer ${
                  activeTab === 'sabores'
                    ? 'border-b-primary text-gray-900 dark:text-white'
                    : 'border-b-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <IceCream className="size-4 text-primary" />
                <span>Sabores</span>
              </button>

              <button
                onClick={() => setActiveTab('coberturas')}
                className={`flex items-center gap-2 border-b-[3px] pb-3 pt-2 font-bold text-sm transition-all cursor-pointer ${
                  activeTab === 'coberturas'
                    ? 'border-b-primary text-gray-900 dark:text-white'
                    : 'border-b-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Sparkles className="size-4 text-caramel" />
                <span>Coberturas</span>
              </button>

              <button
                onClick={() => setActiveTab('outros')}
                className={`flex items-center gap-2 border-b-[3px] pb-3 pt-2 font-bold text-sm transition-all cursor-pointer ${
                  activeTab === 'outros'
                    ? 'border-b-primary text-gray-900 dark:text-white'
                    : 'border-b-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Package className="size-4 text-green-500" />
                <span>Outros Produtos</span>
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-white/20 rounded-xl bg-white dark:bg-surface-dark text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder={activeTab === 'sabores' ? 'Buscar sabor...' : activeTab === 'coberturas' ? 'Buscar cobertura...' : 'Buscar produto...'}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Botão Adicionar 100% Funcional */}
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 h-11 px-5 rounded-xl bg-primary text-[#0d1b14] font-black text-sm hover:bg-opacity-90 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>{addButtonLabel}</span>
            </button>
          </div>

          {/* Data Table */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-500 uppercase border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="p-4">Item</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Tipo de Venda</th>
                    <th className="p-4">Receita / Custo</th>
                    <th className="p-4">Preço (R$)</th>
                    <th className="p-4">Margem</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10 font-medium">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400">
                        Nenhum item cadastrado nesta categoria. Toque em "{addButtonLabel}" acima para cadastrar o primeiro!
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(product => {
                      const recipe = getRecipeForProduct(product.id);
                      const cost = product.total_cost || 0;
                      const margin = product.margin_percentage || 0;

                      return (
                        <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="p-4 text-gray-900 dark:text-white font-bold flex items-center gap-3">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className="size-10 rounded-xl object-cover" />
                            ) : (
                              <div className="size-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-black">
                                {product.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span>{product.name}</span>
                              {product.description && (
                                <p className="text-xs text-gray-400 font-normal line-clamp-1">{product.description}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-gray-500">
                            <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-bold">
                              {product.category_name || 'Geral'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                              {product.sale_type === 'WEIGHT' ? 'Por Quilo' : product.sale_type === 'SCOOP' ? 'Por Bola' : 'Unidade'}
                            </span>
                          </td>
                          <td className="p-4">
                            {recipe ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                  <CheckCircle className="size-3" /> Ficha Cadastrada
                                </span>
                                <span className="text-xs text-gray-500">
                                  Custo: {formatCurrency(cost)}
                                </span>
                              </div>
                            ) : (
                              <NavLink
                                to="/recipes"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              >
                                <PlusCircle className="size-3" /> Criar receita
                              </NavLink>
                            )}
                          </td>
                          <td className="p-4 font-black text-base text-gray-900 dark:text-white">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="p-4">
                            {recipe ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                margin >= 50 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
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
                            <div className="flex justify-end gap-1.5">
                              <button 
                                onClick={() => handleOpenEdit(product)}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                                title="Editar"
                              >
                                <Edit className="size-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(product.id, product.name)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                                title="Remover"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal de Criação / Edição de Produto */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="flex flex-col w-full max-w-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-primary/10">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingProduct ? 'Editar Produto' : addButtonLabel}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                      Nome do Produto / Sabor
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Ex: Doce de Leite com Nozes"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                        Preço de Venda (R$)
                      </label>
                      <input
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        placeholder="Ex: 6,00"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                        Categoria
                      </label>
                      <select
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                        Modalidade de Venda
                      </label>
                      <select
                        value={formData.sale_type}
                        onChange={(e) => setFormData({ ...formData, sale_type: e.target.value as any })}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold"
                      >
                        <option value="SCOOP">Por Bola (Sorveteria)</option>
                        <option value="UNIT">Unitário (Balcão / Bebidas)</option>
                        <option value="WEIGHT">Por Quilo (Balança / Buffet)</option>
                      </select>
                    </div>

                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_flavor}
                          onChange={(e) => setFormData({ ...formData, is_flavor: e.target.checked })}
                          className="size-4 rounded text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          É Sabor de Sorvete?
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                      Descrição / Ingredientes Especiais
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Sorvete artesanal à base de leite e pasta pura..."
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                      URL da Imagem (Opcional)
                    </label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl font-black text-sm bg-primary text-[#0d1b14] hover:bg-opacity-90 disabled:opacity-50 shadow-md"
                    >
                      {editingProduct ? 'Salvar Alterações' : 'Cadastrar'}
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
};

export default Products;
