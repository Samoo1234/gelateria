import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { inventoryService, InventoryStats, LowStockIngredient } from '../services/inventoryService';
import { tubService, TubWithFlavor } from '../services/tubService';
import { getIngredients, IngredientWithCategory } from '../services/ingredientService';
import { ReconcileTubModal } from '../components/ReconcileTubModal';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  RefreshCw, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  X
} from 'lucide-react';

const Inventory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'tubs' | 'movements'>('ingredients');
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    inStockItems: 0,
    lowStockCount: 0,
    totalStockValue: 0
  });
  const [ingredients, setIngredients] = useState<IngredientWithCategory[]>([]);
  const [lowStockList, setLowStockList] = useState<LowStockIngredient[]>([]);
  const [tubs, setTubs] = useState<TubWithFlavor[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reconcileTubTarget, setReconcileTubTarget] = useState<TubWithFlavor | null>(null);
  
  // Formulário de movimentação rápida
  const [selectedIngredientId, setSelectedIngredientId] = useState('');
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'LOSS' | 'ADJUST'>('IN');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, ingData, lowData, tubsData, movementsData] = await Promise.all([
        inventoryService.getInventoryStats(),
        getIngredients(),
        inventoryService.getLowStockIngredients(),
        tubService.getActiveTubs(),
        inventoryService.getRecentMovements(15),
      ]);

      setStats(statsData);
      setIngredients(ingData as any || []);
      setLowStockList(lowData);
      setTubs(tubsData);
      setRecentMovements(movementsData);
    } catch (err: any) {
      console.error('Erro ao carregar dados do inventário:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredientId) {
      setNotification({ text: 'Selecione um ingrediente.', type: 'error' });
      return;
    }
    const qty = parseFloat(movementQuantity.replace(',', '.'));
    if (isNaN(qty) || qty <= 0) {
      setNotification({ text: 'Informe uma quantidade válida.', type: 'error' });
      return;
    }

    const ing = ingredients.find(i => i.id === selectedIngredientId);
    if (!ing) return;

    try {
      setIsSubmitting(true);
      setNotification(null);
      await inventoryService.recordMovement(
        selectedIngredientId,
        movementType,
        qty,
        ing.unit,
        movementReason || undefined
      );

      setNotification({ text: 'Movimentação registrada com sucesso!', type: 'success' });
      setMovementQuantity('');
      setMovementReason('');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setNotification({ text: err.message || 'Erro ao registrar movimentação.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 h-full space-y-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight">
              Controle de Estoque & Insumos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Monitore matérias-primas, embalagens, cubas de sorvete e movimentações em tempo real.
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
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 h-10 rounded-xl bg-primary text-[#0d1b14] hover:bg-opacity-90 text-sm font-black transition-all shadow-sm"
            >
              <Plus className="size-4" />
              <span>Movimentar Estoque</span>
            </button>
          </div>
        </header>

        {/* Notificação */}
        {notification && (
          <div className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-bold ${
            notification.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300'
          }`}>
            {notification.type === 'error' ? <AlertCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Estatísticas Reais */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 rounded-2xl p-5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total de Insumos</span>
            <span className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              {stats.totalItems}
            </span>
            <span className="text-xs text-gray-400">Cadastrados no catálogo</span>
          </div>

          <div className="flex flex-col gap-1 rounded-2xl p-5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Com Saldo Positivo</span>
            <span className="text-3xl font-black text-green-600 dark:text-green-400 mt-1">
              {stats.inStockItems}
            </span>
            <span className="text-xs text-gray-400">Disponíveis para uso</span>
          </div>

          <div className="flex flex-col gap-1 rounded-2xl p-5 bg-white dark:bg-surface-dark border border-amber-300/50 dark:border-amber-500/50 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Estoque Crítico</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {stats.lowStockCount}
              </span>
              <AlertTriangle className="size-6 text-amber-500" />
            </div>
            <span className="text-xs text-gray-400">Abaixo do mínimo recomendado</span>
          </div>

          <div className="flex flex-col gap-1 rounded-2xl p-5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Custo Total em Estoque</span>
            <span className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              R$ {stats.totalStockValue.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-xs text-gray-400">Valor patrimonial de insumos</span>
          </div>
        </section>

        {/* Abas */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 gap-6">
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`pb-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'ingredients'
                ? 'border-primary text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Matérias-Primas ({ingredients.length})
          </button>

          <button
            onClick={() => setActiveTab('tubs')}
            className={`pb-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'tubs'
                ? 'border-primary text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Cubas de Sorvete no Balcão ({tubs.length})
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`pb-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'movements'
                ? 'border-primary text-gray-900 dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Histórico de Movimentações ({recentMovements.length})
          </button>
        </div>

        {/* Conteúdo da Aba: Ingredientes */}
        {activeTab === 'ingredients' && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-surface-dark/90 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Ingrediente</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Estoque Atual</th>
                    <th className="px-6 py-4">Estoque Mínimo</th>
                    <th className="px-6 py-4">Custo Unitário</th>
                    <th className="px-6 py-4">Valor Total</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                  {ingredients.map(ing => {
                    const current = Number(ing.current_stock || 0);
                    const min = Number(ing.min_stock || 0);
                    const cost = Number(ing.cost_per_unit || 0);
                    const isLow = current <= min;

                    return (
                      <tr key={ing.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                          {ing.name}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {ing.category_name || '-'}
                        </td>
                        <td className="px-6 py-4 font-black">
                          {current.toFixed(3)} {ing.unit}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {min.toFixed(3)} {ing.unit}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          R$ {cost.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-primary">
                          R$ {(current * cost).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="px-6 py-4">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                              <AlertTriangle className="size-3" />
                              Baixo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Conteúdo da Aba: Cubas de Sorvete */}
        {activeTab === 'tubs' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tubs.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 text-gray-400">
                  Nenhuma cuba cadastrada no momento.
                </div>
              ) : (
                tubs.map(tub => {
                  const capacity = Number(tub.capacity_kg || 5);
                  const current = Number(tub.current_weight_kg || 0);
                  const percent = Math.min(100, Math.max(0, (current / capacity) * 100));

                  return (
                    <div
                      key={tub.id}
                      className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                            {tub.code}
                          </span>
                          <span className={`text-xs font-bold uppercase ${tub.status === 'in_use' ? 'text-green-600' : 'text-gray-400'}`}>
                            {tub.status === 'in_use' ? 'Em Uso' : 'Vazia'}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-gray-900 dark:text-white">
                          {tub.product_name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Capacidade: {capacity.toFixed(2)}kg • Peso Atual: <strong>{current.toFixed(2)}kg</strong>
                        </p>

                        {/* Barra de Progresso do Volume */}
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full mt-4 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent > 40 ? 'bg-primary' : percent > 15 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
                        <span>Restante: {percent.toFixed(0)}%</span>
                        {tub.status === 'in_use' && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setReconcileTubTarget(tub)}
                              className="text-primary hover:underline font-bold flex items-center gap-1"
                            >
                              ⚖ Reconciliar
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Deseja marcar a cuba de ${tub.product_name} como vazia?`)) {
                                  await tubService.closeTub(tub.id);
                                  await loadData();
                                }
                              }}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              Finalizar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Conteúdo da Aba: Histórico de Movimentações */}
        {activeTab === 'movements' && (
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-surface-dark/90 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Data / Hora</th>
                    <th className="px-6 py-4">Ingrediente</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Quantidade</th>
                    <th className="px-6 py-4">Custo Total</th>
                    <th className="px-6 py-4">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                  {recentMovements.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {new Date(m.movement_date || m.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {m.ingredient_name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                          m.movement_type === 'IN'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : m.movement_type === 'LOSS'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                            : 'bg-primary/20 text-primary'
                        }`}>
                          {m.movement_type === 'IN' ? 'Entrada' : m.movement_type === 'OUT' ? 'Saída' : m.movement_type === 'LOSS' ? 'Perda' : 'Ajuste'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black">
                        {Number(m.quantity).toFixed(3)} {m.unit}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">
                        R$ {Number(m.total_cost || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {m.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de Movimentação de Estoque */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="flex flex-col w-full max-w-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-primary/10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Registrar Movimentação de Insumo
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <form onSubmit={handleRecordMovement} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                    Ingrediente
                  </label>
                  <select
                    value={selectedIngredientId}
                    onChange={(e) => setSelectedIngredientId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold"
                  >
                    <option value="">Selecione o ingrediente...</option>
                    {ingredients.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name} (Atual: {Number(i.current_stock).toFixed(2)} {i.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                    Tipo de Movimentação
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'IN', label: 'Entrada' },
                      { id: 'OUT', label: 'Saída' },
                      { id: 'LOSS', label: 'Perda' },
                      { id: 'ADJUST', label: 'Ajuste' },
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setMovementType(t.id as any)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          movementType === t.id
                            ? 'bg-primary text-[#0d1b14] border-primary shadow-sm'
                            : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                    Quantidade
                  </label>
                  <input
                    type="text"
                    value={movementQuantity}
                    onChange={(e) => setMovementQuantity(e.target.value)}
                    placeholder="Ex: 10"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                    Motivo / Observação
                  </label>
                  <input
                    type="text"
                    value={movementReason}
                    onChange={(e) => setMovementReason(e.target.value)}
                    placeholder="Ex: Compra de reposição, avaria de embalagem..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl font-black text-sm bg-primary text-[#0d1b14] hover:bg-opacity-90 disabled:opacity-50"
                  >
                    Confirmar Lançamento
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Reconciliação de Cuba */}
        <ReconcileTubModal
          isOpen={!!reconcileTubTarget}
          onClose={() => setReconcileTubTarget(null)}
          tub={reconcileTubTarget}
          onSuccess={async () => {
            setNotification({ text: 'Cuba reconciliada com sucesso!', type: 'success' });
            await loadData();
          }}
        />

      </div>
    </Layout>
  );
};

export default Inventory;
