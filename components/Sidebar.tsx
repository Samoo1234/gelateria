import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Vendas', icon: 'receipt_long', path: '/pos' },
    { name: 'Produtos', icon: 'icecream', path: '/products' },
    { name: 'Ingredientes', icon: 'nutrition', path: '/ingredients' },
    { name: 'Receitas', icon: 'restaurant_menu', path: '/recipes' },
    { name: 'Estoque', icon: 'inventory_2', path: '/inventory' },
    { name: 'Relatórios', icon: 'bar_chart', path: '/reports' },
    { name: 'Análise de Custos', icon: 'monitoring', path: '/cost-analysis' },
    { name: 'Funcionários', icon: 'group', path: '/employees' },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl p-6 flex flex-col justify-between border-r border-gray-200/50 dark:border-white/5 h-screen sticky top-0 overflow-y-auto z-20 shadow-glass">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 px-2">
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-2xl size-12 shadow-md"
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCBnzIRXgTgzMcDQNVVduVZ6JhsHiyBcr3auxWHPTJltQeWFeDazMOA_kJwun01bkHqS2LVjOkx9njPUB2-1JLf3HuXaGNiHPGJ48pSHWIzA5GLLWt7Lu1zXW3_gOc7Jz4qQPAokHZlUrL0cvkUajH2pneekH72rM5-Y0m2iI-a5pk-l1O93igoEl6T99g76U2AvbVz1a6drE4uicxBBmO9Cij7dNZhjIyDyPh7jp-cy8GyPDew46Z7enYe4OgRCtVxV6SQh6KRcJ0")' }}
          ></div>
          <div className="flex flex-col">
            <h1 className="text-gray-900 dark:text-white text-lg font-bold tracking-tight font-display">Gelato</h1>
            <p className="text-cta dark:text-cta/80 text-xs font-semibold tracking-wider font-body uppercase">Manager</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ease-fluid group relative overflow-hidden ${isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-semibold shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/5'
                }`
              }
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-fluid ${item.path === window.location.hash.replace('#', '') ? 'opacity-100' : ''}`}></div>
              <span className={`material-symbols-outlined relative z-10 transition-transform duration-300 ease-bounce-soft group-hover:scale-110 ${item.path === window.location.hash.replace('#', '') ? 'fill' : ''}`}>{item.icon}</span>
              <p className="text-sm leading-normal relative z-10">{item.name}</p>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-2 mt-8">
        <NavLink to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-xl transition-all duration-300 ease-fluid group">
          <span className="material-symbols-outlined transition-transform duration-300 ease-bounce-soft group-hover:rotate-45">settings</span>
          <p className="text-sm font-medium leading-normal">Configurações</p>
        </NavLink>
        <button className="flex items-center gap-3 px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl w-full text-left transition-all duration-300 ease-fluid group">
          <span className="material-symbols-outlined transition-transform duration-300 ease-bounce-soft group-hover:-translate-x-1">logout</span>
          <p className="text-sm font-medium leading-normal">Sair</p>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
