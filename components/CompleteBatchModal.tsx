import React, { useState } from 'react';
import { productionService, ProductionBatchRow } from '../services/productionService';
import { useAuth } from '../contexts/AuthContext';

interface CompleteBatchModalProps {
  isOpen: boolean;
  batch: ProductionBatchRow | null;
  onClose: () => void;
  onCompleted: () => void;
}

const CompleteBatchModal: React.FC<CompleteBatchModalProps> = ({
  isOpen,
  batch,
  onClose,
  onCompleted,
}) => {
  const { user } = useAuth();
  const [producedQuantity, setProducedQuantity] = useState<number>(batch?.planned_quantity || 5);
  const [lossQuantity, setLossQuantity] = useState<number>(0);
  const [tubsCount, setTubsCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (batch) {
      setProducedQuantity(Number(batch.planned_quantity || 5));
      setLossQuantity(0);
      setTubsCount(Math.max(1, Math.round(Number(batch.planned_quantity || 5) / 5)));
    }
  }, [batch]);

  if (!isOpen || !batch) return null;

  const planned = Number(batch.planned_quantity || 1);
  const efficiency = planned > 0 ? ((producedQuantity / planned) * 100).toFixed(1) : '100';
  const weightPerTub = tubsCount > 0 ? (producedQuantity / tubsCount).toFixed(2) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (producedQuantity <= 0) {
      setError('A quantidade produzida deve ser maior que zero.');
      return;
    }
    if (lossQuantity < 0) {
      setError('A perda não pode ser negativa.');
      return;
    }
    if (tubsCount <= 0) {
      setError('Informe pelo menos 1 cuba para receber o gelato.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await productionService.completeBatchWithTubs({
        batchId: batch.id,
        batchCode: batch.batch_code,
        recipeId: batch.recipe_id,
        productId: batch.product_id || (batch as any).recipes?.product_id,
        producedQuantity,
        lossQuantity,
        employeeId: user?.id || '00000000-0000-0000-0000-000000000000',
        tubsCount,
        notes: notes || `Produção concluída por ${user?.name || 'Operador'}`,
      });

      onCompleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao concluir lote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">
                Concluir Ordem de Produção
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {batch.batch_code} • {batch.recipes?.name || 'Gelato Artesanal'}
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Métricas de Pesagem */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10">
              <span className="text-[11px] text-gray-500 font-semibold block">Volume Planejado</span>
              <span className="text-lg font-black text-gray-700 dark:text-gray-300 font-mono">
                {planned} kg
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block">
                Rendimento Efetivo
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {efficiency}%
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10">
              <span className="text-[11px] text-gray-500 font-semibold block">Peso Médio / Cuba</span>
              <span className="text-lg font-black text-gray-900 dark:text-white font-mono">
                {weightPerTub} kg
              </span>
            </div>
          </div>

          {/* Inputs de Pesagem Real e Perdas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Peso Real Produzido (kg) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={producedQuantity}
                  onChange={(e) => setProducedQuantity(Number(e.target.value))}
                  className="w-full h-11 pl-3 pr-10 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                  required
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-gray-400">KG</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Perdas / Descarte na Produtora (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lossQuantity}
                  onChange={(e) => setLossQuantity(Number(e.target.value))}
                  className="w-full h-11 pl-3 pr-10 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-gray-400">KG</span>
              </div>
            </div>
          </div>

          {/* Geração de Cubas */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-lg">
                shelves
              </span>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                Entrada Automática em Estoque (Cubas)
              </h4>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Informe quantas cubas serão geradas e armazenadas na câmara fria:
            </p>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="20"
                value={tubsCount}
                onChange={(e) => setTubsCount(Math.max(1, Number(e.target.value)))}
                className="w-24 h-11 px-3 text-center font-bold text-base rounded-xl bg-white dark:bg-surface-dark border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                cuba(s) de aproximadamente <strong>{weightPerTub} kg</strong> cada
              </span>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Observações do Fechamento
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Textura e overrun excelentes, cubas enviadas à câmara 2."
              className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
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
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-md"
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">verified</span>
                  Finalizar e Abater Estoque
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteBatchModal;
