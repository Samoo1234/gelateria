import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SwitchUserModal: React.FC<SwitchUserModalProps> = ({ isOpen, onClose }) => {
  const { switchUser, user } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setError('O PIN deve ter no mínimo 4 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await switchUser(pin);
      if (res.success) {
        setPin('');
        onClose();
      } else {
        setError(res.message || 'PIN incorreto.');
        setPin('');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao trocar de operador.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">swap_horiz</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
              Trocar de Operador
            </h3>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Operador atual:</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {user?.name || 'Não identificado'} ({user?.role || 'Visitante'})
          </p>
        </div>

        {/* PIN Display */}
        <div className="my-5 flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 h-14 w-full bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`size-4 rounded-full transition-all duration-200 ${
                  pin.length > idx
                    ? 'bg-primary scale-110 shadow-sm'
                    : 'border-2 border-gray-300 dark:border-gray-600 bg-transparent'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium mt-2 animate-shake">
              {error}
            </p>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(String(num))}
              className="h-12 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold text-lg transition-all active:scale-95 flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-xl bg-gray-100/60 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 font-medium text-xs transition-colors flex items-center justify-center"
          >
            LIMPAR
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-bold text-lg transition-all active:scale-95 flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-gray-100/60 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-medium transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-lg">backspace</span>
          </button>
        </div>

        <div className="mt-5">
          <button
            type="button"
            disabled={pin.length < 4 || loading}
            onClick={() => handleSubmit()}
            className="w-full py-3 rounded-xl bg-primary text-gray-900 dark:text-black font-bold text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <span className="size-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <>
                <span className="material-symbols-outlined text-base">check</span>
                Confirmar PIN
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwitchUserModal;
