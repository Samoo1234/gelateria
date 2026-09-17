import React, { useState, useEffect } from 'react';
import { productionService } from '../services/productionService';
import { useAuth } from '../contexts/AuthContext';

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const NewBatchModal: React.FC<NewBatchModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [plannedQuantity, setPlannedQuantity] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingRecipes, setFetchingRecipes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRecipes();
    }
  }, [isOpen]);

  const loadRecipes = async () => {
    setFetchingRecipes(true);
    setError(null);
    try {
      const data = await productionService.getRecipesForProduction();
      setRecipes(data);
      if (data.length > 0) {
        setSelectedRecipeId(data[0].id);
        setPlannedQuantity(Number(data[0].yield || 5));
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar receitas.');
    } finally {
      setFetchingRecipes(false);
    }
  };

  if (!isOpen) return null;

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);
  const baseYield = Number(selectedRecipe?.yield || 1);
  const scaleRatio = plannedQuantity > 0 && baseYield > 0 ? plannedQuantity / baseYield : 1;

  // Verifica se todos os ingredientes possuem estoque suficiente
  const ingredientStatus = (selectedRecipe?.recipe_items || []).map((item: any) => {
    const required = Number((item.quantity * scaleRatio).toFixed(3));
    const current = Number(item.ingredients?.current_stock || 0);
    const hasStock = current >= required;
    return {
      ...item,
      required,
      current,
      hasStock,
    };
  });

  const allIngredientsAvailable = ingredientStatus.every((i: any) => i.hasStock);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId) {
      setError('Selecione uma receita.');
      return;
    }
    if (plannedQuantity <= 0) {
      setError('A quantidade planejada deve ser maior que zero.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await productionService.createBatch(
        selectedRecipeId,
        plannedQuantity,
        user?.id,
        notes || `Batelada iniciada por ${user?.name || 'Operador'}`
      );
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao iniciar lote de fabricação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">precision_manufacturing</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">
                Nova Ordem de Produção
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Inicie uma nova batelada de fabricação com reserva de matéria-prima
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Seleção de Receita & Quantidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Receita / Sabor do Gelato
              </label>
              {fetchingRecipes ? (
                <div className="h-11 flex items-center text-xs text-gray-500">
                  Carregando receitas...
                </div>
              ) : recipes.length === 0 ? (
                <div className="h-11 flex items-center text-xs text-amber-500">
                  Nenhuma receita cadastrada. Cadastre em /recipes.
                </div>
              ) : (
                <select
                  value={selectedRecipeId}
                  onChange={(e) => {
                    setSelectedRecipeId(e.target.value);
                    const r = recipes.find((x) => x.id === e.target.value);
                    if (r) setPlannedQuantity(Number(r.yield || 5));
                  }}
                  className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.products?.name || 'Receita sem nome'} ({r.yield || 1} kg padrão)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Volume Planejado (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="100"
                  value={plannedQuantity}
                  onChange={(e) => setPlannedQuantity(Number(e.target.value))}
                  className="w-full h-11 pl-3 pr-10 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-gray-400">
                  KG
                </span>
              </div>
            </div>
          </div>

          {/* Pesagem dos Insumos da Batelada */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Insumos Necessários na Bancada (Escala: {scaleRatio.toFixed(2)}x)
              </h4>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  allIngredientsAvailable
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {allIngredientsAvailable
                  ? '✓ Estoque Suficiente'
                  : '⚠️ Insumos insuficientes'}
              </span>
            </div>

            <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5 max-h-52 overflow-y-auto bg-gray-50/50 dark:bg-black/10">
              {ingredientStatus.length === 0 ? (
                <p className="p-4 text-xs text-center text-gray-400">
                  Nenhum ingrediente vinculado a esta receita.
                </p>
              ) : (
                ingredientStatus.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-lg bg-gray-200 dark:bg-white/10 flex items-center justify-center font-bold text-[11px] text-gray-600 dark:text-gray-300">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {item.ingredients?.name || 'Ingrediente'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Disponível: {item.current} {item.unit}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-gray-900 dark:text-white">
                        {item.required} {item.unit}
                      </p>
                      {!item.hasStock && (
                        <p className="text-[10px] font-semibold text-red-500">
                          Falta {(item.required - item.current).toFixed(3)} {item.unit}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Observações / Instruções para o Gelatiere
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Utilizar leite pasteurizado lote 44; manter maturação de 4 horas."
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || recipes.length === 0}
              className="px-6 py-2.5 rounded-xl bg-primary text-gray-900 dark:text-black text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  Iniciar Batelada
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBatchModal;
