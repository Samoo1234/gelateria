import React from 'react';
import Layout from '../components/Layout';
import { EMPLOYEES } from '../constants';

const Employees: React.FC = () => {
  return (
    <Layout>
      <div className="p-8 h-full overflow-y-auto">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div className="flex min-w-72 flex-col gap-1">
              <p className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Gerenciamento de Funcionários</p>
              <p className="text-gray-500 dark:text-gray-400 text-base font-normal leading-normal">Adicione, edite e gerencie as permissões dos membros da sua equipe.</p>
            </div>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-gray-900 text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined mr-2">add</span>
              <span className="truncate">Adicionar Funcionário</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* List */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <label className="flex flex-col min-w-40 h-12 w-full">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                  <div className="text-gray-500 dark:text-gray-400 flex border-none bg-primary/20 items-center justify-center pl-4 rounded-l-lg border-r-0">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-primary/20 h-full placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal" placeholder="Buscar por nome..." />
                </div>
              </label>
              
              <div className="flex flex-col gap-2">
                {EMPLOYEES.map((emp, index) => (
                  <div 
                    key={emp.id} 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${index === 0 ? 'bg-primary/20 border-l-4 border-primary' : 'hover:bg-primary/20'}`}
                  >
                    <div className="flex flex-col">
                      <p className="font-semibold text-gray-900 dark:text-white">{emp.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{emp.role}</p>
                    </div>
                    <span className={`text-xs font-medium py-1 px-2.5 rounded-full ${
                      emp.status === 'Active' 
                        ? 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' 
                        : 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {emp.status === 'Active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2 bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-200 dark:border-white/10">
              <h2 className="text-gray-900 dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-6">Detalhes do Funcionário</h2>
              <form className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informações Pessoais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Nome Completo</label>
                      <input className="form-input block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-primary focus:border-primary" type="text" defaultValue="Ana Silva"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                      <input className="form-input block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-primary focus:border-primary" type="email" defaultValue="ana.silva@sorveteria.com"/>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acesso e Permissões</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Função</label>
                    <select className="form-select block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-primary focus:border-primary">
                      <option>Caixa</option>
                      <option>Estoquista</option>
                      <option selected>Gerente</option>
                      <option>Administrador</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">A função 'Administrador' concede acesso a todas as áreas do sistema.</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="flex items-center">
                      <input defaultChecked className="form-checkbox h-5 w-5 rounded text-primary bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-gray-700 focus:ring-primary" type="checkbox"/>
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Registrar Vendas e Controle de Caixa</span>
                    </label>
                    <label className="flex items-center">
                      <input defaultChecked className="form-checkbox h-5 w-5 rounded text-primary bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-gray-700 focus:ring-primary" type="checkbox"/>
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Gestão de Estoque e Produtos</span>
                    </label>
                    <label className="flex items-center">
                      <input defaultChecked className="form-checkbox h-5 w-5 rounded text-primary bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-gray-700 focus:ring-primary" type="checkbox"/>
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">Acessar Relatórios Financeiros</span>
                    </label>
                    <label className="flex items-center">
                      <input className="form-checkbox h-5 w-5 rounded text-primary bg-gray-50 dark:bg-black/20 border-gray-300 dark:border-gray-700 focus:ring-primary" disabled type="checkbox"/>
                      <span className="ml-3 text-sm text-gray-400 dark:text-gray-500">Gerenciar Funcionários (Apenas Admin)</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-3">
                    <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-gray-900 text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90 transition-opacity" type="submit">
                      <span className="truncate">Salvar Alterações</span>
                    </button>
                    <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 text-gray-900 dark:text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/30 transition-colors" type="button">
                      <span className="truncate">Resetar Senha</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="text-sm font-medium text-red-500 hover:underline" type="button">Desativar Conta</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Employees;
