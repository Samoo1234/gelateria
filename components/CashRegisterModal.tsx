import React, { useState, useEffect } from 'react';
import { 
  cashRegisterService, 
  CashRegisterSessionRow, 
  SessionSummary 
} from '../services/cashRegisterService';
import { 
  X, 
  Lock, 
  Unlock, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  CreditCard,
  QrCode
} from 'lucide-react';

interface CashRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  terminalId: string | null;
  employeeId: string | null;
  currentSession: CashRegisterSessionRow | null;
  onSessionUpdated: () => void;
}

type TabType = 'open' | 'sangria' | 'suprimento' | 'summary' | 'close';

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  isOpen,
  onClose,
  terminalId,
  employeeId,
  currentSession,
  onSessionUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(currentSession ? 'summary' : 'open');
  const [amountInput, setAmountInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  // Carregar resumo se houver sessão aberta
  const loadSummary = async () => {
    if (!currentSession) {
      setSummary(null);
      return;
    }
    try {
      setIsLoadingSummary(true);
      const data = await cashRegisterService.getSessionSummary(currentSession.id);
      setSummary(data);
    } catch (err: any) {
      console.error('Erro ao carregar resumo de caixa:', err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStatusMessage(null);
      setAmountInput('');
      setReasonInput('');
      setNotesInput('');
      if (currentSession) {
        setActiveTab('summary');
        loadSummary();
      } else {
        setActiveTab('open');
      }
    }
  }, [isOpen, currentSession]);

  if (!isOpen) return null;

  // 1. Abertura de Caixa
  const handleOpenSession = async () => {
    if (!terminalId) {
      setStatusMessage({ text: 'Selecione um terminal válido para o PDV.', type: 'error' });
      return;
    }
    const initialAmt = parseFloat(amountInput.replace(',', '.')) || 0;
    if (initialAmt < 0) {
      setStatusMessage({ text: 'O fundo de troco não pode ser negativo.', type: 'error' });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage(null);
      await cashRegisterService.openSession(terminalId, employeeId || '', initialAmt, notesInput);
      setStatusMessage({ text: 'Caixa aberto com sucesso!', type: 'success' });
      onSessionUpdated();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Erro ao abrir caixa.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Sangria ou Suprimento
  const handleAddMovement = async (type: 'sangria' | 'suprimento') => {
    if (!currentSession) return;
    const amt = parseFloat(amountInput.replace(',', '.')) || 0;
    if (amt <= 0) {
      setStatusMessage({ text: 'Informe um valor maior que zero.', type: 'error' });
      return;
    }
    if (!reasonInput || reasonInput.trim() === '') {
      setStatusMessage({ text: 'A justificativa do lançamento é obrigatória.', type: 'error' });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage(null);
      await cashRegisterService.addCashMovement(currentSession.id, employeeId, type, amt, reasonInput);
      setStatusMessage({
        text: `${type === 'sangria' ? 'Sangria' : 'Suprimento'} registrado com sucesso!`,
        type: 'success',
      });
      setAmountInput('');
      setReasonInput('');
      await loadSummary();
      onSessionUpdated();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Erro na movimentação.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Fechamento de Caixa
  const handleCloseSession = async () => {
    if (!currentSession) return;
    const actualAmt = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(actualAmt) || actualAmt < 0) {
      setStatusMessage({ text: 'Informe o total contado em dinheiro na gaveta.', type: 'error' });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage(null);
      await cashRegisterService.closeSession(currentSession.id, actualAmt, notesInput);
      setStatusMessage({ text: 'Caixa fechado com sucesso!', type: 'success' });
      onSessionUpdated();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Erro ao fechar caixa.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] bg-surface-light dark:bg-background-dark border border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 bg-primary/10">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center size-10 rounded-xl ${currentSession ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
              {currentSession ? <Unlock className="size-5" /> : <Lock className="size-5" />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0d1b14] dark:text-surface-light">
                Gestão & Movimentação de Caixa
              </h3>
              <p className="text-xs text-text-muted">
                Status: <strong className={currentSession ? 'text-green-600 dark:text-green-400' : 'text-amber-600'}>
                  {currentSession ? 'Sessão Aberta' : 'Caixa Fechado'}
                </strong>
                {currentSession && ` • Aberto às ${new Date(currentSession.opened_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
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

        {/* Tab Navigation */}
        <div className="flex border-b border-primary/20 bg-surface-light dark:bg-surface-dark px-6 gap-2 pt-2">
          {!currentSession ? (
            <button
              onClick={() => setActiveTab('open')}
              className="px-4 py-2.5 font-bold text-xs border-b-2 border-primary text-primary transition-all"
            >
              Abertura de Caixa
            </button>
          ) : (
            <>
              <button
                onClick={() => { setActiveTab('summary'); loadSummary(); }}
                className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all ${
                  activeTab === 'summary' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-primary'
                }`}
              >
                Resumo da Sessão
              </button>
              <button
                onClick={() => setActiveTab('sangria')}
                className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all ${
                  activeTab === 'sangria' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-primary'
                }`}
              >
                Sangria (Retirada)
              </button>
              <button
                onClick={() => setActiveTab('suprimento')}
                className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all ${
                  activeTab === 'suprimento' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-primary'
                }`}
              >
                Suprimento (Entrada)
              </button>
              <button
                onClick={() => { setActiveTab('close'); loadSummary(); }}
                className={`px-4 py-2.5 font-bold text-xs border-b-2 transition-all ${
                  activeTab === 'close' ? 'border-red-500 text-red-500' : 'border-transparent text-text-muted hover:text-red-500'
                }`}
              >
                Fechar Caixa
              </button>
            </>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {statusMessage && (
            <div className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-bold ${
              statusMessage.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300'
            }`}>
              {statusMessage.type === 'error' ? <AlertCircle className="size-4 shrink-0" /> : <CheckCircle2 className="size-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB: Abertura de Caixa */}
          {activeTab === 'open' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                <h4 className="font-bold text-sm text-[#0d1b14] dark:text-surface-light mb-1">
                  Iniciar Nova Sessão de Vendas
                </h4>
                <p className="text-xs text-text-muted">
                  Informe o fundo de troco inicial em dinheiro colocado na gaveta do caixa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Fundo de Troco Inicial (R$)
                </label>
                <input
                  type="text"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Ex: 100,00"
                  className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-lg font-black focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Observações de Abertura
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ex: Turno da manhã, notas de troco conferidas..."
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={handleOpenSession}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-primary text-[#0d1b14] font-black text-sm hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
              >
                {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Unlock className="size-4" />}
                Confirmar Abertura de Caixa
              </button>
            </div>
          )}

          {/* TAB: Resumo da Sessão */}
          {activeTab === 'summary' && currentSession && (
            <div className="space-y-4">
              {isLoadingSummary ? (
                <div className="flex flex-col items-center justify-center py-10 text-text-muted gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <span className="text-xs font-semibold">Atualizando balanço da sessão...</span>
                </div>
              ) : summary ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark">
                      <span className="text-[11px] text-text-muted font-bold block">Fundo Inicial</span>
                      <span className="text-base font-black text-[#0d1b14] dark:text-surface-light">
                        R$ {summary.initialAmount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark">
                      <span className="text-[11px] text-green-600 dark:text-green-400 font-bold block">Vendas Dinheiro</span>
                      <span className="text-base font-black text-green-600 dark:text-green-400">
                        + R$ {summary.totalSalesMoney.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark">
                      <span className="text-[11px] text-caramel font-bold block">Suprimentos</span>
                      <span className="text-base font-black text-caramel">
                        + R$ {summary.totalSuprimentos.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark">
                      <span className="text-[11px] text-red-500 font-bold block">Sangrias</span>
                      <span className="text-base font-black text-red-500">
                        - R$ {summary.totalSangrias.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Dinheiro Esperado em Gaveta */}
                  <div className="p-4 rounded-xl border-2 border-primary bg-primary/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">
                        Dinheiro Esperado na Gaveta
                      </span>
                      <span className="text-xs text-text-muted">
                        Fundo + Vendas Dinheiro + Entradas - Sangrias
                      </span>
                    </div>
                    <span className="text-2xl font-black text-primary">
                      R$ {summary.expectedCashInDrawer.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  {/* Vendas Eletrônicas */}
                  <div className="p-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark flex items-center justify-around text-center">
                    <div>
                      <span className="text-[11px] text-text-muted font-bold block flex items-center justify-center gap-1">
                        <CreditCard className="size-3" /> Cartões
                      </span>
                      <span className="text-sm font-black">
                        R$ {summary.totalSalesCard.toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="h-8 w-px bg-primary/20"></div>

                    <div>
                      <span className="text-[11px] text-text-muted font-bold block flex items-center justify-center gap-1">
                        <QrCode className="size-3" /> PIX
                      </span>
                      <span className="text-sm font-black">
                        R$ {summary.totalSalesPix.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* TAB: Sangria (Retirada) */}
          {activeTab === 'sangria' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10">
                <h4 className="font-bold text-sm text-red-700 dark:text-red-300 mb-1">
                  Registrar Sangria (Retirada de Dinheiro)
                </h4>
                <p className="text-xs text-text-muted">
                  Utilize para recolhimento de segurança ou pagamento de despesa urgente em espécie.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Valor da Retirada (R$)
                </label>
                <input
                  type="text"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-lg font-black focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Justificativa Obrigatória
                </label>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Ex: Sangria para cofre principal / Pagamento de gelo..."
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={() => handleAddMovement('sangria')}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
              >
                {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <TrendingDown className="size-4" />}
                Confirmar Retirada (Sangria)
              </button>
            </div>
          )}

          {/* TAB: Suprimento (Entrada de Troco) */}
          {activeTab === 'suprimento' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-900/10">
                <h4 className="font-bold text-sm text-green-700 dark:text-green-300 mb-1">
                  Registrar Suprimento (Entrada de Troco)
                </h4>
                <p className="text-xs text-text-muted">
                  Utilize para reforçar moedas ou notas miúdas na gaveta do caixa.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Valor do Suprimento (R$)
                </label>
                <input
                  type="text"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-lg font-black focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Justificativa
                </label>
                <input
                  type="text"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Ex: Troco de moedas de R$ 1,00..."
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={() => handleAddMovement('suprimento')}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-green-600 text-white font-black text-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
              >
                {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <TrendingUp className="size-4" />}
                Confirmar Entrada (Suprimento)
              </button>
            </div>
          )}

          {/* TAB: Fechamento de Caixa */}
          {activeTab === 'close' && currentSession && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-900/10">
                <h4 className="font-bold text-sm text-red-700 dark:text-red-300 mb-1">
                  Encerramento de Turno / Caixa
                </h4>
                <p className="text-xs text-text-muted">
                  Conte todo o dinheiro físico presente na gaveta e insira abaixo para apuração de diferenças.
                </p>
              </div>

              {summary && (
                <div className="flex justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold">
                  <span>Dinheiro Estimado pelo Sistema:</span>
                  <span className="text-primary font-black">
                    R$ {summary.expectedCashInDrawer.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Valor Contado na Gaveta (R$)
                </label>
                <input
                  type="text"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-lg font-black focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1.5">
                  Observações de Encerramento
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ex: Turno encerrado sem pendências..."
                  className="w-full px-4 py-2.5 rounded-xl border border-primary/20 bg-surface-light dark:bg-surface-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={handleCloseSession}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-red-600 text-white font-black text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-md"
              >
                {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                Confirmar Fechamento de Caixa
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
