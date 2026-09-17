import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const { loginWithPin, loginWithEmail, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'pin' | 'email'>('pin');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redireciona se já estiver logado
  React.useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'Caixa') navigate('/pos', { replace: true });
        else if (user.role === 'Produção') navigate('/production', { replace: true });
        else navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate, location]);

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

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setError('Informe um PIN de pelo menos 4 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await loginWithPin(pin);
      if (!res.success) {
        setError(res.message || 'PIN inválido.');
        setPin('');
      }
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha email e senha.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await loginWithEmail(email, password);
      if (!res.success) {
        setError(res.message || 'Email ou senha inválidos.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const setPresetPin = (preset: string) => {
    setPin(preset);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-emerald-50 via-gray-50 to-teal-50 dark:from-background-dark dark:via-surface-dark dark:to-background-dark p-4">
      <div className="w-full max-w-md bg-white/90 dark:bg-surface-dark/95 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="size-16 rounded-2xl bg-center bg-cover shadow-lg mb-3"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCBnzIRXgTgzMcDQNVVduVZ6JhsHiyBcr3auxWHPTJltQeWFeDazMOA_kJwun01bkHqS2LVjOkx9njPUB2-1JLf3HuXaGNiHPGJ48pSHWIzA5GLLWt7Lu1zXW3_gOc7Jz4qQPAokHZlUrL0cvkUajH2pneekH72rM5-Y0m2iI-a5pk-l1O93igoEl6T99g76U2AvbVz1a6drE4uicxBBmO9Cij7dNZhjIyDyPh7jp-cy8GyPDew46Z7enYe4OgRCtVxV6SQh6KRcJ0")',
            }}
          />
          <h1 className="text-2xl font-black text-gray-900 dark:text-white font-display tracking-tight">
            Gelato <span className="text-primary font-bold">Manager</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Sistema Integrado de Gestão & Frente de Loja
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-gray-100 dark:bg-black/20 p-1 rounded-xl mb-6 border border-gray-200/60 dark:border-white/5">
          <button
            type="button"
            onClick={() => {
              setMode('pin');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              mode === 'pin'
                ? 'bg-white dark:bg-surface-dark text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">pin</span>
            PIN Rápido (Operador)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('email');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
              mode === 'email'
                ? 'bg-white dark:bg-surface-dark text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">mail</span>
            E-mail & Senha (Admin)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Mode 1: Quick PIN */}
        {mode === 'pin' && (
          <div>
            {/* PIN Indicator */}
            <div className="flex items-center justify-center gap-3 h-14 w-full bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/10 mb-6">
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

            {/* Virtual Keypad */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
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
                className="h-12 rounded-xl bg-gray-100/60 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold text-xs transition-colors flex items-center justify-center"
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

            <button
              type="button"
              disabled={pin.length < 4 || loading}
              onClick={() => handlePinSubmit()}
              className="w-full py-3.5 rounded-xl bg-primary text-gray-900 dark:text-black font-bold text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <span className="size-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">login</span>
                  Entrar no Terminal
                </>
              )}
            </button>
          </div>
        )}

        {/* Mode 2: Email and Password */}
        {mode === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                E-mail Corporativo
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gelato.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-primary text-gray-900 dark:text-black font-bold text-sm tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <span className="size-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">login</span>
                  Entrar como Gestor
                </>
              )}
            </button>
          </form>
        )}

        {/* Quick Access Badges (Atalhos de Acesso Rápido) */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-white/5">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-center mb-2.5">
            Acesso Rápido por Perfil (Clique para preencher)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode('pin');
                setPresetPin('1234');
              }}
              className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30 text-center transition-colors"
            >
              <span className="block text-[11px] font-bold">Caixa</span>
              <span className="block text-[10px] opacity-75 font-mono">PIN: 1234</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('pin');
                setPresetPin('5678');
              }}
              className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30 text-center transition-colors"
            >
              <span className="block text-[11px] font-bold">Fábrica</span>
              <span className="block text-[10px] opacity-75 font-mono">PIN: 5678</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('pin');
                setPresetPin('9999');
              }}
              className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30 text-center transition-colors"
            >
              <span className="block text-[11px] font-bold">Admin</span>
              <span className="block text-[10px] opacity-75 font-mono">PIN: 9999</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
