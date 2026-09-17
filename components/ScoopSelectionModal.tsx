import React, { useState } from 'react';
import { ContainerRow, ProductRow } from '../services/orderService';
import { X, Check, IceCream, Plus, Minus } from 'lucide-react';

interface ScoopSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseProduct: ProductRow;
  availableContainers: ContainerRow[];
  availableFlavors: ProductRow[];
  onConfirm: (container: ContainerRow, selectedFlavors: string[], notes?: string) => void;
}

export const ScoopSelectionModal: React.FC<ScoopSelectionModalProps> = ({
  isOpen,
  onClose,
  baseProduct,
  availableContainers,
  availableFlavors,
  onConfirm,
}) => {
  const [selectedContainer, setSelectedContainer] = useState<ContainerRow | null>(
    availableContainers[0] || null
  );
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const maxScoops = selectedContainer?.scoop_capacity || 1;

  const handleAddFlavor = (flavorName: string) => {
    if (selectedFlavors.length < maxScoops) {
      setSelectedFlavors(prev => [...prev, flavorName]);
    }
  };

  const handleRemoveFlavor = (indexToRemove: number) => {
    setSelectedFlavors(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleContainerChange = (container: ContainerRow) => {
    setSelectedContainer(container);
    // Se o novo recipiente couber menos bolas, corta o excesso
    const newCap = container.scoop_capacity || 1;
    if (selectedFlavors.length > newCap) {
      setSelectedFlavors(prev => prev.slice(0, newCap));
    }
  };

  const handleConfirm = () => {
    if (!selectedContainer) return;
    if (selectedFlavors.length === 0) {
      alert('Selecione pelo menos um sabor.');
      return;
    }
    onConfirm(selectedContainer, selectedFlavors, notes);
    onClose();
  };

  const containerPrice = Number(selectedContainer?.price || 0);
  const scoopCount = Math.max(1, selectedFlavors.length);
  const progressiveScale: Record<number, number> = { 1: 7.00, 2: 12.00, 3: 16.00 };
  const baseScoopPrice = progressiveScale[scoopCount] || (Number(baseProduct.price) * scoopCount);
  const premiumTotal = selectedFlavors.reduce((acc, flvName) => {
    const flavorProd = availableFlavors.find(f => f.name === flvName);
    return acc + (flavorProd?.is_premium ? Number(flavorProd.premium_surcharge || 0) : 0);
  }, 0);
  const calculatedTotal = baseScoopPrice + containerPrice + premiumTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] bg-surface-light dark:bg-background-dark border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-primary/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary/20 text-primary">
              <IceCream className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0d1b14] dark:text-surface-light">
                Montar Sorvete por Bola
              </h3>
              <p className="text-xs text-text-muted">
                Escolha o recipiente e até {maxScoops} {maxScoops > 1 ? 'sabores' : 'sabor'} (1 bola: R$ 7 | 2 bolas: R$ 12 | 3 bolas: R$ 16)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center size-10 rounded-full bg-surface-light/80 dark:bg-surface-dark/80 hover:bg-red-100 dark:hover:bg-red-900/30 text-text-muted hover:text-red-500 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Passo 1: Escolha do Recipiente */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-3">
              1. Selecione o Recipiente
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableContainers.map(c => {
                const isSelected = selectedContainer?.id === c.id;
                const extraPrice = Number(c.price || 0);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleContainerChange(c)}
                    className={`flex flex-col text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer min-h-[72px] ${
                      isSelected
                        ? 'border-primary bg-primary/15 shadow-md shadow-primary/10'
                        : 'border-primary/10 hover:border-primary/40 bg-surface-light dark:bg-surface-dark'
                    }`}
                  >
                    <span className="font-bold text-sm text-[#0d1b14] dark:text-surface-light">
                      {c.name}
                    </span>
                    <div className="flex items-center justify-between mt-auto pt-1 text-xs">
                      <span className="text-primary font-semibold">
                        Até {c.scoop_capacity || 1} {c.scoop_capacity && c.scoop_capacity > 1 ? 'bolas' : 'bola'}
                      </span>
                      {extraPrice > 0 && (
                        <span className="text-caramel font-bold">
                          +R$ {extraPrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passo 2: Sabores Escolhidos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted">
                2. Sabores Selecionados ({selectedFlavors.length}/{maxScoops})
              </h4>
              {selectedFlavors.length < maxScoops && (
                <span className="text-xs text-caramel font-semibold animate-pulse">
                  Selecione mais {maxScoops - selectedFlavors.length}
                </span>
              )}
            </div>

            {/* Slots de Bolas */}
            <div className="flex flex-wrap gap-2 min-h-[48px] p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5">
              {selectedFlavors.length === 0 ? (
                <p className="text-sm text-text-muted italic flex items-center">
                  Nenhum sabor adicionado ainda. Toque nos sabores abaixo.
                </p>
              ) : (
                selectedFlavors.map((flavor, idx) => {
                  const flavorObj = availableFlavors.find(f => f.name === flavor);
                  return (
                    <div
                      key={`${flavor}-${idx}`}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-[#0d1b14] font-bold text-sm shadow-sm"
                    >
                      <span>Bola {idx + 1}: {flavor}</span>
                      {flavorObj?.is_premium && (
                        <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black">
                          PREMIUM
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveFlavor(idx)}
                        className="size-5 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Passo 3: Grade de Sabores para Toque */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-3">
              3. Sabores Disponíveis (Toque para adicionar)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {availableFlavors.map(f => {
                const countOfThis = selectedFlavors.filter(name => name === f.name).length;
                const isFull = selectedFlavors.length >= maxScoops;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleAddFlavor(f.name)}
                    disabled={isFull}
                    className={`flex flex-col justify-between p-3 rounded-xl border text-left transition-all min-h-[64px] active:scale-95 ${
                      isFull
                        ? 'opacity-50 border-gray-200 dark:border-gray-800 cursor-not-allowed bg-gray-50 dark:bg-gray-900/50'
                        : 'border-primary/20 hover:border-primary bg-surface-light dark:bg-surface-dark cursor-pointer hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-sm text-[#0d1b14] dark:text-surface-light">
                        {f.name}
                      </span>
                      {countOfThis > 0 && (
                        <span className="size-6 rounded-full bg-primary text-[#0d1b14] font-extrabold text-xs flex items-center justify-center ml-1">
                          {countOfThis}x
                        </span>
                      )}
                    </div>
                    {f.is_premium && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded w-max mt-1">
                        PREMIUM (+R$ {Number(f.premium_surcharge || 2).toFixed(2).replace('.', ',')})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Observações (Ex: Sem calda, canudo extra)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional..."
              className="w-full px-4 py-2.5 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-primary/20 bg-primary/5">
          <div>
            <span className="text-xs text-text-muted block">Valor do Item</span>
            <span className="text-2xl font-black text-[#0d1b14] dark:text-surface-light">
              R$ {calculatedTotal.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl font-bold text-sm bg-surface-light dark:bg-surface-dark border border-primary/20 hover:bg-primary/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedFlavors.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm bg-primary text-[#0d1b14] hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-transform active:scale-95"
            >
              <Check className="size-4" />
              Adicionar ao Pedido
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
