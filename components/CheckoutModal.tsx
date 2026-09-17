import React, { useState } from 'react';
import { PaymentPayload, FinalizeSaleResult } from '../services/orderService';
import { defaultReceiptPrinter } from '../services/printer/ReceiptPrinterAdapter';
import { 
  X, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  AlertCircle,
  Loader2,
  Trash2,
  Printer
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onFinalize: (payments: PaymentPayload[]) => Promise<FinalizeSaleResult>;
  isProcessing: boolean;
  cartItems?: any[];
  discount?: number;
  terminalCode?: string;
  operatorName?: string;
}

type PaymentMethodKey = 'money' | 'credit_card' | 'debit_card' | 'pix';

const METHOD_LABELS: Record<PaymentMethodKey, { label: string; icon: React.ReactNode }> = {
  money: { label: 'Dinheiro', icon: <Banknote className="size-5" /> },
  pix: { label: 'PIX', icon: <QrCode className="size-5" /> },
  credit_card: { label: 'Cartão Crédito', icon: <CreditCard className="size-5" /> },
  debit_card: { label: 'Cartão Débito', icon: <CreditCard className="size-5" /> },
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onFinalize,
  isProcessing,
  cartItems = [],
  discount = 0,
  terminalCode = 'CAIXA-01',
  operatorName = 'Operador',
}) => {
  const [payments, setPayments] = useState<PaymentPayload[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodKey>('money');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shouldPrint, setShouldPrint] = useState<boolean>(true);
  const [printWidth, setPrintWidth] = useState<58 | 80>(80);

  if (!isOpen) return null;

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(0, Number((totalAmount - totalPaid).toFixed(2)));
  const change = Math.max(0, Number((totalPaid - totalAmount).toFixed(2)));

  const handleAddPayment = () => {
    const value = parseFloat(inputAmount.replace(',', '.')) || remaining;
    if (value <= 0) {
      setErrorMessage('Informe um valor maior que zero.');
      return;
    }

    setErrorMessage(null);
    setPayments(prev => [
      ...prev,
      {
        payment_method: selectedMethod,
        amount: Number(value.toFixed(2)),
        change_amount: selectedMethod === 'money' && (value + totalPaid > totalAmount)
          ? Number((value + totalPaid - totalAmount).toFixed(2))
          : 0,
      }
    ]);
    setInputAmount('');
  };

  const handleRemovePayment = (index: number) => {
    setPayments(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleQuickPayFull = (method: PaymentMethodKey) => {
    if (remaining <= 0) return;
    setPayments(prev => [
      ...prev,
      {
        payment_method: method,
        amount: remaining,
        change_amount: 0,
      }
    ]);
  };

  const handleExecuteCheckout = async () => {
    if (totalPaid < totalAmount) {
      setErrorMessage(`Pagamento insuficiente. Falta receber R$ ${remaining.toFixed(2).replace('.', ',')}`);
      return;
    }

    try {
      setErrorMessage(null);
      const result = await onFinalize(payments);

      // Impressão automática se selecionada (Etapas 20 e 21)
      if (shouldPrint && result?.order_number) {
        defaultReceiptPrinter.printReceipt({
          orderNumber: result.order_number,
          createdAt: new Date().toISOString(),
          operatorName,
          terminalCode,
          items: cartItems.map(item => ({
            name: item.productName,
            saleType: item.saleType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            containerName: item.containerName,
            grossWeight: item.grossWeight,
            tareWeight: item.tareWeight,
            netWeight: item.netWeight,
            flavors: item.selectedFlavors,
            notes: item.notes
          })),
          subtotal: totalAmount + discount,
          discount: discount,
          total: totalAmount,
          payments: payments.map(p => ({
            method: METHOD_LABELS[p.payment_method]?.label || p.payment_method,
            amount: p.amount,
            change: p.change_amount
          }))
        }, printWidth);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao concluir venda.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-xl max-h-[90vh] bg-surface-light dark:bg-background-dark border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-primary/10">
          <div>
            <h3 className="text-xl font-bold text-[#0d1b14] dark:text-surface-light">
              Finalizar Venda (Pagamento)
            </h3>
            <p className="text-xs text-text-muted">
              Total a pagar: <strong className="text-primary text-sm font-extrabold">R$ {totalAmount.toFixed(2).replace('.', ',')}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex items-center justify-center size-10 rounded-full bg-surface-light/80 dark:bg-surface-dark/80 hover:bg-red-100 dark:hover:bg-red-900/30 text-text-muted hover:text-red-500 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Alerta de Erro */}
          {errorMessage && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="size-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Formas Rápidas (Toque único para pagar restante) */}
          {remaining > 0 && (
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                Pagamento Rápido do Restante (R$ {remaining.toFixed(2).replace('.', ',')})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(METHOD_LABELS) as PaymentMethodKey[]).map(method => (
                  <button
                    key={method}
                    onClick={() => handleQuickPayFull(method)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark hover:bg-primary/15 hover:border-primary transition-all text-center cursor-pointer active:scale-95"
                  >
                    <div className="text-primary">{METHOD_LABELS[method].icon}</div>
                    <span className="text-xs font-bold text-[#0d1b14] dark:text-surface-light">
                      {METHOD_LABELS[method].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divisão de Pagamento Customizada */}
          {remaining > 0 && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                Ou Inserir Parcial / Múltiplas Formas:
              </span>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value as PaymentMethodKey)}
                  className="px-3 py-2.5 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-sm font-semibold"
                >
                  <option value="money">Dinheiro</option>
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                </select>

                <input
                  type="text"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  placeholder={`R$ ${remaining.toFixed(2).replace('.', ',')}`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <button
                  onClick={handleAddPayment}
                  className="px-5 py-2.5 rounded-xl bg-primary text-[#0d1b14] font-bold text-sm hover:bg-opacity-90 transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  Lançar
                </button>
              </div>
            </div>
          )}

          {/* Lista de Pagamentos Lançados */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
              Pagamentos Lançados ({payments.length})
            </span>
            {payments.length === 0 ? (
              <p className="text-sm text-text-muted italic text-center py-4 border border-dashed border-primary/20 rounded-xl">
                Nenhum pagamento lançado. Escolha uma opção acima.
              </p>
            ) : (
              <div className="space-y-2">
                {payments.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-primary">{METHOD_LABELS[p.payment_method as PaymentMethodKey]?.icon}</div>
                      <div>
                        <span className="font-bold text-sm text-[#0d1b14] dark:text-surface-light block">
                          {METHOD_LABELS[p.payment_method as PaymentMethodKey]?.label || p.payment_method}
                        </span>
                        {p.payment_method === 'money' && (p.change_amount || 0) > 0 && (
                          <span className="text-xs text-caramel font-semibold">
                            Troco: R$ {(p.change_amount || 0).toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-base text-primary">
                        R$ {p.amount.toFixed(2).replace('.', ',')}
                      </span>
                      <button
                        onClick={() => handleRemovePayment(idx)}
                        disabled={isProcessing}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumo do Status de Pagamento */}
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/10 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Total Pago:</span>
              <span className="font-bold">R$ {totalPaid.toFixed(2).replace('.', ',')}</span>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between text-sm text-caramel font-bold">
                <span>Restante a Pagar:</span>
                <span>R$ {remaining.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            {change > 0 && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-extrabold">
                <span>Troco a Devolver:</span>
                <span>R$ {change.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
          </div>

          {/* Opção de Impressão Térmica (Etapas 20 e 21) */}
          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-surface-dark flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={shouldPrint}
                onChange={(e) => setShouldPrint(e.target.checked)}
                className="size-4 rounded text-primary focus:ring-primary"
              />
              <Printer className="size-4 text-primary" />
              <span>Imprimir comprovante térmico (Não fiscal)</span>
            </label>

            {shouldPrint && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPrintWidth(80)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                    printWidth === 80 
                      ? 'bg-primary text-[#0d1b14]' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  80mm
                </button>
                <button
                  type="button"
                  onClick={() => setPrintWidth(58)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                    printWidth === 58 
                      ? 'bg-primary text-[#0d1b14]' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  58mm
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-primary/20 bg-primary/5">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-5 py-3 rounded-xl font-bold text-sm bg-surface-light dark:bg-surface-dark border border-primary/20 hover:bg-primary/10 transition-colors"
          >
            Voltar
          </button>
          
          <button
            onClick={handleExecuteCheckout}
            disabled={isProcessing || totalPaid < totalAmount}
            className="flex items-center gap-2 px-8 py-3 rounded-xl font-extrabold text-base bg-primary text-[#0d1b14] hover:bg-opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg transition-transform active:scale-95"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-5" />
                <span>Confirmar e Finalizar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
