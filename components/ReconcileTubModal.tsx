import React, { useState } from 'react';
import { TubWithFlavor, tubService } from '../services/tubService';
import { Scale, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ReconcileTubModalProps {
  isOpen: boolean;
  onClose: () => void;
  tub: TubWithFlavor | null;
  onSuccess: () => void;
  activeEmployeeId?: string | null;
  activeTerminalId?: string | null;
}

export const ReconcileTubModal: React.FC<ReconcileTubModalProps> = ({
  isOpen,
  onClose,
  tub,
  onSuccess,
  activeEmployeeId,
  activeTerminalId,
}) => {
  const [physicalWeight, setPhysicalWeight] = useState('');
  const [reason, setReason] = useState('Conferência física diária de balcão');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !tub) return null;

  const estimated = Number(tub.current_weight_kg || 0);
  const physical = parseFloat(physicalWeight.replace(',', '.')) || 0;
  const difference = Number((physical - estimated).toFixed(3));

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!physicalWeight.trim() || isNaN(physical) || physical < 0) {
      setError('Informe um peso físico válido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await tubService.reconcileTub(
        tub.id,
        physical,
        activeEmployeeId || '00000000-0000-0000-0000-000000000000',
        activeTerminalId || '00000000-0000-0000-0000-000000000000',
        reason
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao reconciliar cuba:', err);
      setError(err.message || 'Falha ao salvar reconciliação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-lg bg-surface-light dark:bg-background-dark border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-primary/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary/20 text-primary">
              <Scale className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Reconciliar Cuba Física
              </h3>
              <p className="text-xs text-text-muted">
                {tub.code} • {tub.product_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-8 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="size-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Comparativo de Pesos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-800">
              <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                Peso Estimado (Sistema)
              </span>
              <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {estimated.toFixed(3)} <span className="text-xs font-normal text-gray-500">kg</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <span className="text-xs text-primary uppercase font-bold tracking-wider">
                Diferença Apurada
              </span>
              <p className={`text-2xl font-black mt-1 ${
                difference === 0 ? 'text-gray-900 dark:text-white' : difference < 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {difference > 0 ? `+${difference.toFixed(3)}` : difference.toFixed(3)} <span className="text-xs font-normal text-gray-500">kg</span>
              </p>
            </div>
          </div>

          {/* Campo de Peso Físico */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Peso Real Aferido na Balança (kg) *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 2.650"
              value={physicalWeight}
              onChange={(e) => setPhysicalWeight(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-900 dark:text-white text-lg font-bold focus:ring-2 focus:ring-primary focus:outline-none"
              autoFocus
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Pese a cuba cheia menos o peso da tara do recipiente se aplicável.
            </p>
          </div>

          {/* Motivo / Justificativa */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Justificativa da Divergência / Motivo
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Degelo natural, raspagem de cuba, degustação"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>

          {difference < 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="size-4 flex-shrink-0 mt-0.5" />
              <span>
                A divergência negativa ({Math.abs(difference).toFixed(3)} kg) será registrada automaticamente como perda de estoque (INVENTORY_DIFFERENCE) com rastreabilidade auditável.
              </span>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !physicalWeight.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <span>Gravando...</span>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>Confirmar Reconciliação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
