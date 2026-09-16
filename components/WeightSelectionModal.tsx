import React, { useState, useEffect, useMemo } from 'react';
import { ContainerRow, ProductRow } from '../services/orderService';
import { scaleManager, ScaleReading } from '../services/scale';
import { 
  X, 
  Check, 
  Scale, 
  Usb, 
  Delete, 
  AlertCircle,
  Package,
  Layers
} from 'lucide-react';

interface WeightSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductRow;
  availableContainers: ContainerRow[];
  onConfirm: (container: ContainerRow, grossWeightKg: number, notes?: string) => void;
}

export const WeightSelectionModal: React.FC<WeightSelectionModalProps> = ({
  isOpen,
  onClose,
  product,
  availableContainers,
  onConfirm,
}) => {
  const [selectedContainer, setSelectedContainer] = useState<ContainerRow | null>(
    availableContainers[0] || null
  );
  
  // Modo de balança (manual ou serial)
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [isConnectingSerial, setIsConnectingSerial] = useState(false);
  
  // Peso bruto em formato de string para digitação no teclado touch
  const [weightInput, setWeightInput] = useState<string>('0');
  const [grossWeightKg, setGrossWeightKg] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Iniciar listener da balança ativa
  useEffect(() => {
    if (!isOpen) return;

    const adapter = scaleManager.getActiveAdapter();
    const unsubscribe = adapter.onWeightChange?.((reading: ScaleReading) => {
      setGrossWeightKg(reading.weightKg);
      setWeightInput((reading.weightKg * 1000).toFixed(0)); // exibe em gramas no input
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Tara cadastrada em kg (ex: 0.022 kg = 22g)
  const tareWeightKg = Number(selectedContainer?.tare_weight || 0);
  // Peso líquido em kg
  const netWeightKg = Math.max(0, Number((grossWeightKg - tareWeightKg).toFixed(3)));
  
  const pricePerKg = Number(product.price);
  const calculatedSubtotal = Number((netWeightKg * pricePerKg).toFixed(2));

  // Teclado virtual touch para entrada em gramas (ex: 450 = 0.450 kg)
  const handleKeyClick = (key: string) => {
    if (isSerialConnected) return; // bloqueia se balança serial estiver transmitindo

    let next = weightInput;
    if (key === 'CLEAR') {
      next = '0';
    } else if (key === 'BACK') {
      next = next.length > 1 ? next.slice(0, -1) : '0';
    } else {
      if (next === '0') {
        next = key;
      } else if (next.length < 5) {
        next += key;
      }
    }

    setWeightInput(next);
    const grams = parseInt(next, 10) || 0;
    const kg = grams / 1000;
    setGrossWeightKg(kg);
    scaleManager.getManualAdapter().setManualWeight(kg);
  };

  // Atalhos de peso rápido (buffet comum)
  const handleQuickWeightGrams = (grams: number) => {
    if (isSerialConnected) return;
    setWeightInput(grams.toString());
    const kg = grams / 1000;
    setGrossWeightKg(kg);
    scaleManager.getManualAdapter().setManualWeight(kg);
  };

  const handleToggleSerial = async () => {
    if (isSerialConnected) {
      await scaleManager.getSerialAdapter().disconnect();
      scaleManager.useManual();
      setIsSerialConnected(false);
    } else {
      setIsConnectingSerial(true);
      try {
        const adapter = await scaleManager.useSerial();
        if (adapter.id === 'web-serial-scale') {
          setIsSerialConnected(true);
        } else {
          setErrorMsg('Não foi possível conectar à balança serial. Usando entrada manual.');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao conectar balança serial.');
      } finally {
        setIsConnectingSerial(false);
      }
    }
  };

  const handleConfirm = () => {
    if (!selectedContainer) {
      setErrorMsg('Selecione um recipiente para desconto de tara.');
      return;
    }
    if (grossWeightKg <= 0) {
      setErrorMsg('Informe o peso do produto.');
      return;
    }
    if (grossWeightKg <= tareWeightKg) {
      setErrorMsg('O peso bruto deve ser maior que a tara do recipiente.');
      return;
    }

    onConfirm(selectedContainer, grossWeightKg, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-3xl max-h-[95vh] bg-surface-light dark:bg-background-dark border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-primary/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary/20 text-primary">
              <Scale className="size-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0d1b14] dark:text-surface-light">
                Pesagem & Tara Automática
              </h3>
              <p className="text-xs text-text-muted">
                Produto: <strong>{product.name}</strong> • R$ {pricePerKg.toFixed(2).replace('.', ',')} / kg
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSerial}
              disabled={isConnectingSerial}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isSerialConnected
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-400'
                  : 'bg-surface-light dark:bg-surface-dark text-text-muted border-primary/20 hover:border-primary'
              }`}
            >
              <Usb className="size-4" />
              <span>{isSerialConnected ? 'Balança Conectada' : 'Conectar Balança Serial'}</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center size-10 rounded-full bg-surface-light/80 dark:bg-surface-dark/80 hover:bg-red-100 dark:hover:bg-red-900/30 text-text-muted hover:text-red-500 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {errorMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Seleção do Recipiente (Desconto da Tara Oficial) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                1. Recipiente / Embalagem (Tara Automática)
              </span>
              {selectedContainer && (
                <span className="text-xs font-bold text-caramel">
                  Tara: {(tareWeightKg * 1000).toFixed(0)}g descontada
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {availableContainers.map(c => {
                const isSelected = selectedContainer?.id === c.id;
                const taraGrams = (Number(c.tare_weight) * 1000).toFixed(0);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContainer(c)}
                    className={`flex flex-col p-3 rounded-xl border-2 text-left transition-all cursor-pointer min-h-[68px] active:scale-95 ${
                      isSelected
                        ? 'border-primary bg-primary/15 shadow-sm'
                        : 'border-primary/10 hover:border-primary/40 bg-surface-light dark:bg-surface-dark'
                    }`}
                  >
                    <span className="font-bold text-xs text-[#0d1b14] dark:text-surface-light line-clamp-1">
                      {c.name}
                    </span>
                    <div className="mt-auto pt-1 flex items-center justify-between text-[11px] text-text-muted">
                      <span>Tara: <strong className="text-caramel">{taraGrams}g</strong></span>
                      {Number(c.price || 0) > 0 && (
                        <span className="text-primary font-bold">+R$ {Number(c.price).toFixed(2)}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Display de Balança Digital */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-surface-light dark:to-surface-dark border border-primary/30">
            {/* Peso Bruto */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-light dark:bg-surface-dark/90 border border-primary/20">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                Peso Bruto
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#0d1b14] dark:text-surface-light">
                  {grossWeightKg.toFixed(3)}
                </span>
                <span className="text-sm font-bold text-text-muted">kg</span>
              </div>
              <span className="text-[11px] text-text-muted">
                {(grossWeightKg * 1000).toFixed(0)} gramas
              </span>
            </div>

            {/* Tara Abatida */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-light dark:bg-surface-dark/90 border border-primary/20">
              <span className="text-xs font-bold uppercase tracking-wider text-caramel mb-1">
                Tara Abatida (-)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-caramel">
                  {tareWeightKg.toFixed(3)}
                </span>
                <span className="text-sm font-bold text-caramel">kg</span>
              </div>
              <span className="text-[11px] text-text-muted">
                {(tareWeightKg * 1000).toFixed(0)} gramas
              </span>
            </div>

            {/* Peso Líquido & Subtotal */}
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-primary/20 border-2 border-primary">
              <span className="text-xs font-black uppercase tracking-wider text-primary mb-1">
                Peso Líquido (=)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#0d1b14] dark:text-surface-light">
                  {netWeightKg.toFixed(3)}
                </span>
                <span className="text-sm font-bold text-text-muted">kg</span>
              </div>
              <div className="mt-1 font-extrabold text-base text-primary">
                Subtotal: R$ {calculatedSubtotal.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>

          {/* 3. Teclado Virtual Touch para Entrada Rápida de Peso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Digitação Rápida (Gramas) ou Atalhos
              </span>
              {isSerialConnected && (
                <span className="text-xs text-green-600 dark:text-green-400 font-bold">
                  Recebendo dados da balança serial continuamente...
                </span>
              )}
            </div>

            {/* Botões de Peso Frequente */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[200, 300, 400, 500, 750, 1000].map(grams => (
                <button
                  key={grams}
                  onClick={() => handleQuickWeightGrams(grams)}
                  disabled={isSerialConnected}
                  className="px-3 py-2 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark hover:bg-primary/20 text-xs font-extrabold text-[#0d1b14] dark:text-surface-light shrink-0 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
                >
                  {grams >= 1000 ? `${grams/1000}kg` : `${grams}g`}
                </button>
              ))}
            </div>

            {/* Grid do Teclado Numérico */}
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map(k => (
                <button
                  key={k}
                  onClick={() => handleKeyClick(k)}
                  disabled={isSerialConnected}
                  className={`h-12 rounded-xl font-black text-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-40 ${
                    k === 'CLEAR'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-bold'
                      : k === 'BACK'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
                      : 'bg-surface-light dark:bg-surface-dark border border-primary/20 text-[#0d1b14] dark:text-surface-light hover:bg-primary/20 shadow-sm'
                  }`}
                >
                  {k === 'BACK' ? <Delete className="size-5" /> : k}
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Observações do Item
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pote para viagem, com tampa reforçada..."
              className="w-full px-4 py-2.5 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-primary/20 bg-primary/5">
          <div>
            <span className="text-xs text-text-muted block">Total Líquido do Item</span>
            <span className="text-2xl font-black text-primary">
              R$ {calculatedSubtotal.toFixed(2).replace('.', ',')}
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
              disabled={netWeightKg <= 0}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm bg-primary text-[#0d1b14] hover:bg-opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-transform active:scale-95"
            >
              <Check className="size-4" />
              Lançar no Pedido
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
