import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  
  const [notifications, setNotifications] = useState({
    lowStock: true,
    salesAlerts: true,
    employeeSchedule: false,
    dailySummary: true,
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <Layout>
      <div className="p-6 lg:p-10 h-full overflow-y-auto">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-black leading-tight tracking-tight text-gray-900 dark:text-white mb-2">
              Configurações
            </h1>
            <p className="text-base font-normal leading-normal text-gray-500 dark:text-gray-400">
              Gerencie as preferências e configurações do sistema.
            </p>
          </header>

          {/* Settings Sections */}
          <div className="flex flex-col gap-6">
            {/* Aparência */}
            <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Aparência
              </h2>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                    dark_mode
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Modo Escuro
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Alternar entre tema claro e escuro
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    darkMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </section>

            {/* Notificações */}
            <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Notificações
              </h2>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                      inventory_2
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Alerta de Estoque Baixo
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receber notificações quando o estoque estiver baixo
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('lowStock')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.lowStock ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.lowStock ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                      notifications
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Alertas de Vendas
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Notificações sobre metas e marcos de vendas
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('salesAlerts')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.salesAlerts ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.salesAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                      group
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Escala de Funcionários
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Lembretes sobre escalas e turnos
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('employeeSchedule')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.employeeSchedule ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.employeeSchedule ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                      summarize
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Resumo Diário
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Receber resumo diário de vendas e estoque
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleNotificationChange('dailySummary')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.dailySummary ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.dailySummary ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            {/* Sobre o Sistema */}
            <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Sobre o Sistema
              </h2>
              
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 py-2">
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                    storefront
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Nome da Loja
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sorveteria Gelato
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                    info
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Versão do Sistema
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      v1.0.0
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2">
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">
                    update
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Última Atualização
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      26 de Novembro de 2025
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Ações */}
            <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Ações
              </h2>
              
              <div className="flex flex-col gap-3">
                <button className="flex items-center gap-3 px-4 py-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined text-primary">
                    backup
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Fazer Backup dos Dados
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Exportar dados do sistema
                    </p>
                  </div>
                </button>

                <button className="flex items-center gap-3 px-4 py-3 text-left rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400">
                    delete_forever
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      Limpar Dados Antigos
                    </p>
                    <p className="text-xs text-red-500 dark:text-red-400/70">
                      Remover dados com mais de 1 ano
                    </p>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
