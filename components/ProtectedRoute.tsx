import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SwitchUserModal from './SwitchUserModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-display text-sm font-semibold text-gray-600 dark:text-gray-300">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-background-dark p-6">
        <div className="max-w-md w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-xl text-center">
          <div className="size-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-4xl">lock</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-display mb-2">
            Acesso Restrito
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Seu perfil atual (<span className="font-semibold text-primary">{user.role}</span>) não possui permissão para acessar esta área restrita ({allowedRoles.join(', ')}).
          </p>

          <div className="p-4 rounded-xl bg-gray-100 dark:bg-black/20 border border-gray-200/60 dark:border-white/5 mb-6 text-left flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Operador Ativo • {user.role}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => setShowSwitchModal(true)}
              className="w-full py-3 px-4 bg-primary text-gray-900 dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-lg">pin</span>
              Trocar de Operador (PIN)
            </button>

            <button
              onClick={() => navigate(user.role === 'Caixa' ? '/pos' : user.role === 'Produção' ? '/production' : '/dashboard')}
              className="w-full py-2.5 px-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors text-sm"
            >
              Voltar para Área Permitida
            </button>
          </div>
        </div>

        {showSwitchModal && (
          <SwitchUserModal isOpen={showSwitchModal} onClose={() => setShowSwitchModal(false)} />
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
