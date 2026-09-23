import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import { 
  getIngredients, 
  createIngredient, 
  updateIngredient, 
  deleteIngredient, 
  IngredientWithCategory 
} from '../services/ingredientService';
import { ingredientTechnicalService } from '../services/ingredientTechnicalService';
import { formatPtBrStock } from '../services/formulationEngine';
import { IngredientTechnicalProfile, DataStatus } from '../types';
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
  DollarSign,
  FlaskConical,
  Sparkles
} from 'lucide-react';

interface IngredientWithProfile extends IngredientWithCategory {
  profile?: IngredientTechnicalProfile | null;
}

const Ingredients: React.FC = () => {
  const [ingredients, setIngredients] = useState<IngredientWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<IngredientWithProfile | null>(null);
  const [modalTab, setModalTab] = useState<'BASIC' | 'TECHNICAL'>('BASIC');
  
  // Basic Form fields
  const [name, setName] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unit, setUnit] = useState('kg');

  // Technical Profile fields
  const [isMixIngredient, setIsMixIngredient] = useState(true);
  const [waterPct, setWaterPct] = useState('0');
  const [totalSolidsPct, setTotalSolidsPct] = useState('100');
  const [fatPct, setFatPct] = useState('0');
  const [msnfPct, setMsnfPct] = useState('0');
  const [lactosePct, setLactosePct] = useState('0');
  const [sucrosePct, setSucrosePct] = useState('0');
  const [otherSugarsPct, setOtherSugarsPct] = useState('0');
  const [podFactor, setPodFactor] = useState('0');
  const [pacFactor, setPacFactor] = useState('0');
  const [densityGPerMl, setDensityGPerMl] = useState('1.0');
  const [dataStatus, setDataStatus] = useState<DataStatus>('ESTIMATED');
  const [source, setSource] = useState('');
  const [techNotes, setTechNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [data, profiles] = await Promise.all([
        getIngredients(),
        ingredientTechnicalService.getAllProfiles()
      ]);

      const profileMap = new Map<string, IngredientTechnicalProfile>();
      profiles.forEach((p) => profileMap.set(p.ingredient_id, p));

      const merged = (data || []).map((ing) => ({
        ...ing,
        profile: profileMap.get(ing.id) || null
      }));

      setIngredients(merged);
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
    setModalTab('BASIC');
    setName('');
    setCostPerUnit('');
    setCurrentStock('0');
    setMinStock('5');
    setUnit('kg');

    // Default tech fields
    setIsMixIngredient(true);
    setWaterPct('0');
    setTotalSolidsPct('100');
    setFatPct('0');
    setMsnfPct('0');
    setLactosePct('0');
    setSucrosePct('0');
    setOtherSugarsPct('0');
    setPodFactor('0');
    setPacFactor('0');
    setDensityGPerMl('1.0');
    setDataStatus('ESTIMATED');
    setSource('');
    setTechNotes('');

    setShowModal(true);
  };

  const handleOpenEdit = (ingredient: IngredientWithProfile) => {
    setEditingIngredient(ingredient);
    setModalTab('BASIC');
    setName(ingredient.name);
    setCostPerUnit(Number(ingredient.cost_per_unit || 0).toString().replace('.', ','));
    setCurrentStock(Number(ingredient.current_stock || 0).toString().replace('.', ','));
    setMinStock(Number(ingredient.min_stock || 0).toString().replace('.', ','));
    setUnit(ingredient.unit || 'kg');

    const prof = ingredient.profile;
    if (prof) {
      setIsMixIngredient(prof.is_mix_ingredient);
      setWaterPct(prof.water_pct.toString());
      setTotalSolidsPct(prof.total_solids_pct.toString());
      setFatPct(prof.fat_pct.toString());
      setMsnfPct(prof.msnf_pct.toString());
      setLactosePct(prof.lactose_pct.toString());
      setSucrosePct(prof.sucrose_pct.toString());
      setOtherSugarsPct(prof.other_sugars_pct.toString());
      setPodFactor(prof.pod_factor.toString());
      setPacFactor(prof.pac_factor.toString());
      setDensityGPerMl(prof.density_g_ml.toString());
      setDataStatus(prof.data_status);
      setSource(prof.source || '');
      setTechNotes(prof.notes || '');
    } else {
      const isPkg = ingredient.unit === 'un' || ingredient.name.toLowerCase().includes('copo') || ingredient.name.toLowerCase().includes('casquinha') || ingredient.name.toLowerCase().includes('colher');
      setIsMixIngredient(!isPkg);
      setWaterPct('0');
      setTotalSolidsPct('100');
      setFatPct('0');
      setMsnfPct('0');
      setLactosePct('0');
      setSucrosePct('0');
      setOtherSugarsPct('0');
      setPodFactor('0');
      setPacFactor('0');
      setDensityGPerMl('1.0');
      setDataStatus('ESTIMATED');
      setSource('');
      setTechNotes('');
    }

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

      let savedIngId = editingIngredient?.id;

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
        const created = await createIngredient({
          name: name.trim(),
          cost_per_unit: cost,
          current_stock: stock,
          min_stock: min,
          unit,
          is_active: true
        });
        savedIngId = created?.id;
        setNotification({ text: 'Novo ingrediente cadastrado com sucesso!', type: 'success' });
      }

      // Salva perfil técnico se houver ID
      if (savedIngId) {
        await ingredientTechnicalService.saveProfile({
          ingredient_id: savedIngId,
          is_mix_ingredient: isMixIngredient,
          water_pct: parseFloat(waterPct.replace(',', '.')) || 0,
          total_solids_pct: parseFloat(totalSolidsPct.replace(',', '.')) || 0,
          fat_pct: parseFloat(fatPct.replace(',', '.')) || 0,
          msnf_pct: parseFloat(msnfPct.replace(',', '.')) || 0,
          lactose_pct: parseFloat(lactosePct.replace(',', '.')) || 0,
          sucrose_pct: parseFloat(sucrosePct.replace(',', '.')) || 0,
          other_sugars_pct: parseFloat(otherSugarsPct.replace(',', '.')) || 0,
          pod_factor: parseFloat(podFactor.replace(',', '.')) || 0,
          pac_factor: parseFloat(pacFactor.replace(',', '.')) || 0,
          density_g_ml: parseFloat(densityGPerMl.replace(',', '.')) || 1.0,
          data_status: dataStatus,
          source: source.trim() || null,
          notes: techNotes.trim() || null
        });
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
            <h1 className="text-gray-900 dark:text-white text-3xl font-black font-display tracking-tight">
              Ingredientes & Matérias-Primas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Gerencie insumos, custos, unidades e fichas técnicas físico-químicas de formulação (POD/PAC).
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

        {/* Tabela de Ingredientes com Parâmetros Técnicos e Formatação pt-BR Inequívoca */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-surface-dark/90 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Insumo</th>
                  <th className="px-6 py-4">Perfil Técnico</th>
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
                  filteredIngredients.map(ing => {
                    const prof = ing.profile;
                    const isMix = prof ? prof.is_mix_ingredient : ing.unit !== 'un';

                    return (
                      <tr key={ing.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 dark:text-white">{ing.name}</p>
                          <p className="text-xs text-gray-500">{ing.category_name || 'Sem categoria'}</p>
                        </td>

                        <td className="px-6 py-4">
                          {!isMix ? (
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 font-medium">
                              Embalagem / Descartável
                            </span>
                          ) : prof ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono">
                                  ST: {prof.total_solids_pct}%
                                </span>
                                {prof.fat_pct > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-mono">
                                    Gord: {prof.fat_pct}%
                                  </span>
                                )}
                                {(prof.pod_factor > 0 || prof.pac_factor > 0) && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-mono">
                                    POD {prof.pod_factor} | PAC {prof.pac_factor}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 flex items-center gap-1">
                                <span className={`inline-block size-1.5 rounded-full ${prof.data_status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                                {prof.data_status === 'CONFIRMED' ? 'Homologado' : 'Estimado'}
                                {prof.source && ` • ${prof.source}`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-500 flex items-center gap-1">
                              <AlertCircle className="size-3" /> Ficha pendente
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300 font-mono">
                          {ing.unit}
                        </td>

                        <td className="px-6 py-4 font-extrabold text-primary font-mono">
                          R$ {Number(ing.cost_per_unit || 0).toFixed(2).replace('.', ',')} / {ing.unit}
                        </td>

                        {/* Estoque Formatado em pt-BR Inequívoco (ex: 50 L em vez de 50.000 L) */}
                        <td className="px-6 py-4 font-black font-mono text-gray-900 dark:text-white">
                          {formatPtBrStock(ing.current_stock, ing.unit)}
                        </td>

                        <td className="px-6 py-4 text-gray-500 font-mono">
                          {formatPtBrStock(ing.min_stock, ing.unit)}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(ing)}
                              className="p-1.5 text-gray-500 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="Editar e Ficha Técnica"
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Unificada: Cadastro Geral + Ficha Técnica de Formulação */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
              
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">
                    {editingIngredient ? `Editar: ${editingIngredient.name}` : 'Cadastrar Novo Insumo'}
                  </h3>
                  <p className="text-xs text-gray-500">Configuração de custos, estoque e parâmetros de mix</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Abas da Modal */}
              <div className="flex gap-2 my-4 p-1 bg-gray-100 dark:bg-black/20 rounded-xl">
                <button
                  type="button"
                  onClick={() => setModalTab('BASIC')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    modalTab === 'BASIC'
                      ? 'bg-white dark:bg-surface-dark text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Cadastro Básico & Estoque
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('TECHNICAL')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    modalTab === 'TECHNICAL'
                      ? 'bg-white dark:bg-surface-dark text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <FlaskConical className="size-3.5" />
                  Ficha Técnica (POD / PAC / Sólidos)
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {modalTab === 'BASIC' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                        Nome do Ingrediente *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Ex: Leite Integral"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                          Custo Unitário (R$) *
                        </label>
                        <input
                          type="text"
                          value={costPerUnit}
                          onChange={(e) => setCostPerUnit(e.target.value)}
                          required
                          placeholder="Ex: 5,50"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold font-mono focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                          Unidade de Medida
                        </label>
                        <select
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold outline-none"
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
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono outline-none"
                        />
                        <span className="text-[10px] text-gray-400">Ex: 50 para cinquenta unidades/litros</span>
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
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-mono outline-none"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Aba Técnica de Formulação */
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">Insumo de Formulação do Mix</p>
                        <p className="text-[11px] text-gray-500">Desmarque se for embalagem ou descartável de atendimento</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isMixIngredient}
                        onChange={(e) => setIsMixIngredient(e.target.checked)}
                        className="size-5 rounded text-primary focus:ring-primary"
                      />
                    </div>

                    {isMixIngredient ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Água %</label>
                            <input
                              type="text"
                              value={waterPct}
                              onChange={(e) => setWaterPct(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Sólidos Totais %</label>
                            <input
                              type="text"
                              value={totalSolidsPct}
                              onChange={(e) => setTotalSolidsPct(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Gordura %</label>
                            <input
                              type="text"
                              value={fatPct}
                              onChange={(e) => setFatPct(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">ESDL % (Leite)</label>
                            <input
                              type="text"
                              value={msnfPct}
                              onChange={(e) => setMsnfPct(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Sacarose %</label>
                            <input
                              type="text"
                              value={sucrosePct}
                              onChange={(e) => setSucrosePct(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Outros Açúcares %</label>
                            <input
                              type="text"
                              value={otherSugarsPct}
                              onChange={(e) => setOtherSugarsPct(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Lactose % (no ESDL)</label>
                            <input
                              type="text"
                              value={lactosePct}
                              onChange={(e) => setLactosePct(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Densidade (g/ml)</label>
                            <input
                              type="text"
                              value={densityGPerMl}
                              onChange={(e) => setDensityGPerMl(e.target.value)}
                              placeholder="1.000"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Fator POD</label>
                            <input
                              type="text"
                              value={podFactor}
                              onChange={(e) => setPodFactor(e.target.value)}
                              placeholder="1.00"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                            />
                            <span className="text-[9px] text-gray-400">Sacarose = 1.0</span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Fator PAC</label>
                            <input
                              type="text"
                              value={pacFactor}
                              onChange={(e) => setPacFactor(e.target.value)}
                              placeholder="1.00"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-mono"
                            />
                            <span className="text-[9px] text-gray-400">Sacarose = 1.0</span>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-[11px] font-bold text-gray-500 mb-1">Confiabilidade do Dado</label>
                            <select
                              value={dataStatus}
                              onChange={(e) => setDataStatus(e.target.value as DataStatus)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold"
                            >
                              <option value="CONFIRMED">Homologado (Laudo/Ficha Técnica Oficial)</option>
                              <option value="ESTIMATED">Estimado (Literatura/Média Geral)</option>
                              <option value="MISSING">Pendente de Validação</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 mb-1">Fonte / Fabricante</label>
                          <input
                            type="text"
                            value={source}
                            onChange={(e) => setSource(e.target.value)}
                            placeholder="Ex: Tabela TACO, Nestlé Professional, Laudo 2026"
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 dark:bg-black/20 rounded-2xl">
                        Este item está classificado como embalagem ou acessório de atendimento. Não são requeridos parâmetros físico-químicos de mix.
                      </div>
                    )}
                  </div>
                )}

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
                    {isSubmitting ? 'Salvando...' : 'Salvar Insumo'}
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
