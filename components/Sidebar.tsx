import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SwitchUserModal from './SwitchUserModal';

interface NavItem {
  name: string;
  icon: string;
  path: string;
  allowedRoles?: string[];
}

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const allNavItems: NavItem[] = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard', allowedRoles: ['Administrador', 'Gerente'] },
    { name: 'Vendas (PDV)', icon: 'receipt_long', path: '/pos', allowedRoles: ['Administrador', 'Gerente', 'Caixa'] },
    { name: 'Produção', icon: 'precision_manufacturing', path: '/production', allowedRoles: ['Administrador', 'Gerente', 'Produção'] },
    { name: 'Produtos', icon: 'icecream', path: '/products', allowedRoles: ['Administrador', 'Gerente', 'Produção', 'Caixa'] },
    { name: 'Ingredientes', icon: 'nutrition', path: '/ingredients', allowedRoles: ['Administrador', 'Gerente', 'Produção'] },
    { name: 'Receitas', icon: 'restaurant_menu', path: '/recipes', allowedRoles: ['Administrador', 'Gerente', 'Produção'] },
    { name: 'Estoque', icon: 'inventory_2', path: '/inventory', allowedRoles: ['Administrador', 'Gerente', 'Produção'] },
    { name: 'Relatórios', icon: 'bar_chart', path: '/reports', allowedRoles: ['Administrador', 'Gerente'] },
    { name: 'Análise de Custos', icon: 'monitoring', path: '/cost-analysis', allowedRoles: ['Administrador', 'Gerente'] },
    { name: 'Funcionários', icon: 'group', path: '/employees', allowedRoles: ['Administrador', 'Gerente'] },
    { name: 'Auditoria', icon: 'security', path: '/audit-logs', allowedRoles: ['Administrador', 'Gerente'] },
  ];

  // Filtra itens de acordo com o perfil do operador
  const navItems = allNavItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return hasRole(item.allowedRoles);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl p-5 flex flex-col justify-between border-r border-gray-200/50 dark:border-white/5 h-screen sticky top-0 overflow-y-auto z-20 shadow-glass">
      <div className="flex flex-col gap-5">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-2xl size-11 shadow-md"
            style={{
              backgroundImage:
                'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCBnzIRXgTgzMcDQNVVduVZ6JhsHiyBcr3auxWHPTJltQeWFeDazMOA_kJwun01bkHqS2LVjOkx9njPUB2-1JLf3HuXaGNiHPGJ48pSHWIzA5GLLWt7Lu1zXW3_gOc7Jz4qQPAokHZlUrL0cvkUajH2pneekH72rM5-Y0m2iI-a5pk-l1O93igoEl6T99g76U2AvbVz1a6drE4uicxBBmO9Cij7dNZhjIyDyPh7jp-cy8GyPDew46Z7enYe4OgRCtVxV6SQh6KRcJ0")',
            }}
          />
          <div className="flex flex-col">
            <h1 className="text-gray-900 dark:text-white text-base font-bold tracking-tight font-display">
              Gelato
            </h1>
            <p className="text-cta dark:text-cta/80 text-[10px] font-semibold tracking-wider font-body uppercase">
              Manager V2
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 ease-fluid group relative overflow-hidden ${
                  isActive
                    ? 'bg-primary/15 text-primary dark:bg-primary/25 dark:text-primary-light font-semibold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-white/5'
                }`
              }
            >
              <span className="material-symbols-outlined text-xl relative z-10 transition-transform duration-300 ease-bounce-soft group-hover:scale-110">
                {item.icon}
              </span>
              <p className="text-xs leading-normal relative z-10 font-medium">{item.name}</p>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer / User Profile & Actions */}
      <div className="flex flex-col gap-2.5 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
        {/* User Card */}
        <div className="p-3 rounded-2xl bg-gray-50/80 dark:bg-black/20 border border-gray-200/60 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="size-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {user?.name || 'Operador'}
              </p>
              <span className="inline-block text-[10px] font-semibold text-primary px-1.5 py-0.2 rounded bg-primary/10">
                {user?.role || 'Acesso'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowSwitchModal(true)}
            title="Trocar operador com PIN"
            className="size-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-base">swap_horiz</span>
          </button>
        </div>

        {hasRole(['Administrador', 'Gerente']) && (
          <NavLink
            to="/settings"
            className="flex items-center gap-2.5 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-xl transition-colors text-xs font-medium"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            Configurações
          </NavLink>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl w-full text-left transition-colors text-xs font-medium"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sair do Sistema
        </button>
      </div>

      {showSwitchModal && (
        <SwitchUserModal isOpen={showSwitchModal} onClose={() => setShowSwitchModal(false)} />
      )}
    </aside>
  );
};

export default Sidebar;
