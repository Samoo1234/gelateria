import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { 
  getIngredients, 
  createIngredient, 
  updateIngredient, 
  deleteIngredient, 
  IngredientWithCategory 
} from '../services/ingredientService';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Boxes,
  DollarSign
} from 'lucide-react';

const Ingredients: React.FC = () => {
  const [ingredients, setIngredients] = useState<IngredientWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientWithCategory | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unit, setUnit] = useState('kg');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getIngredients();
      setIngredients(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar ingredientes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    ingredients.forEach(i => {
      if (i.category_name) set.add(i.category_name);
    });
    return ['all', ...Array.from(set)];
  }, [ingredients]);

  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ing.supplier_name && ing.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || ing.category_name === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, searchTerm, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingIngredient(null);
    setName('');
    setCostPerUnit('');
    setCurrentStock('0');
    setMinStock('5');
    setUnit('kg');
    setShowModal(true);
  };

  const handleOpenEdit = (ingredient: IngredientWithCategory) => {
    setEditingIngredient(ingredient);
    setName(ingredient.name);
    setCostPerUnit(Number(ingredient.cost_per_unit || 0).toString());
    setCurrentStock(Number(ingredient.current_stock || 0).toString());
    setMinStock(Number(ingredient.min_stock || 0).toString());
    setUnit(ingredient.unit || 'kg');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      setNotification(null);

      const cost = parseFloat(costPerUnit.replace(',', '.')) || 0;
      const stock = parseFloat(currentStock.replace(',', '.')) || 0;
      const min = parseFloat(minStock.replace(',', '.')) || 0;

      if (editingIngredient) {
        await updateIngredient(editingIngredient.id, {
          name: name.trim(),
          cost_per_unit: cost,
          current_stock: stock,
          min_stock: min,
          unit,
          last_updated: new Date().toISOString()
        });
        setNotification({ text: 'Ingrediente atualizado com sucesso!', type: 'success' });
      } else {
        await createIngredient({
          name: name.trim(),
          cost_per_unit: cost,
          current_stock: stock,
          min_stock: min,
          unit,
          is_active: true
        });
        setNotification({ text: 'Novo ingrediente cadastrado com sucesso!', type: 'success' });
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setNotification({ text: err.message || 'Erro ao salvar ingrediente.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, ingName: string) => {
    if (confirm(`Deseja realmente desativar o ingrediente "${ingName}"?`)) {
      try {
        await deleteIngredient(id);
        setNotification({ text: `Ingrediente ${ingName} desativado com sucesso.`, type: 'success' });
        await loadData();
      } catch (err: any) {
        setNotification({ text: err.message || 'Erro ao desativar.', type: 'error' });
      }
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 h-full space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight">
              Ingredientes & Matérias-Primas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Gerencie insumos, preços de custo e unidades de medida integradas às fichas técnicas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 h-10 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-bold transition-all"
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 h-10 rounded-xl bg-primary text-[#0d1b14] hover:bg-opacity-90 text-sm font-black transition-all shadow-sm"
            >
              <Plus className="size-4" />
              <span>Novo Ingrediente</span>
            </button>
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

        {/* Filtros & Busca */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-[#0d1b14] shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de Ingredientes Reais */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-surface-dark/90 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Nome do Insumo</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4">Unidade</th>
                  <th className="px-6 py-4">Custo Unitário</th>
                  <th className="px-6 py-4">Estoque Atual</th>
                  <th className="px-6 py-4">Estoque Mínimo</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                {filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      Nenhum ingrediente encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredIngredients.map(ing => (
                    <tr key={ing.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {ing.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {ing.category_name || '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">
                        {ing.unit}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-primary">
                        R$ {Number(ing.cost_per_unit || 0).toFixed(2).replace('.', ',')} / {ing.unit}
                      </td>
                      <td className="px-6 py-4 font-black">
                        {Number(ing.current_stock || 0).toFixed(3)} {ing.unit}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {Number(ing.min_stock || 0).toFixed(3)} {ing.unit}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(ing)}
                            className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Editar"
                          >
                            <Edit className="size-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ing.id, ing.name)}
                            className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Desativar"
                          >
                            <Trash2 className="size-4" />
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

        {/* Modal de Cadastro / Edição */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="flex flex-col w-full max-w-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-primary/10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}
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
                    Nome do Ingrediente
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ex: Leite Integral"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                      Custo Unitário (R$)
                    </label>
                    <input
                      type="text"
                      value={costPerUnit}
                      onChange={(e) => setCostPerUnit(e.target.value)}
                      required
                      placeholder="Ex: 5,50"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                      Unidade de Medida
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold"
                    >
                      <option value="kg">Quilo (kg)</option>
                      <option value="g">Grama (g)</option>
                      <option value="L">Litro (L)</option>
                      <option value="ml">Mililitro (ml)</option>
                      <option value="un">Unidade (un)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                      Estoque Atual
                    </label>
                    <input
                      type="text"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                      Estoque Mínimo
                    </label>
                    <input
                      type="text"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      placeholder="5"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                  </div>
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
                    className="px-6 py-2.5 rounded-xl font-black text-sm bg-primary text-[#0d1b14] hover:bg-opacity-90 disabled:opacity-50"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default Ingredients;
