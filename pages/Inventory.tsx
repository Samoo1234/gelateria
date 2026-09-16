import React from 'react';
import Layout from '../components/Layout';
import { INVENTORY_ITEMS } from '../constants';

const Inventory: React.FC = () => {
  return (
    <Layout>
      <div className="p-6 md:p-8 h-full">
        <div className="flex flex-col max-w-7xl mx-auto flex-1 gap-6">
          {/* PageHeading */}
          <header className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight">Controle de Estoque</h1>
              <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">Monitore os níveis de ingredientes e produtos</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-bold leading-normal tracking-[0.015em]">
                <span className="material-symbols-outlined text-base mr-2">upload_file</span>
                <span className="truncate">Exportar</span>
              </button>
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-black text-sm font-bold leading-normal tracking-[0.015em]">
                <span className="material-symbols-outlined text-base mr-2">add</span>
                <span className="truncate">Adicionar Item</span>
              </button>
            </div>
          </header>

          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800">
              <p className="text-gray-800 dark:text-gray-300 text-base font-medium leading-normal">Total de Itens</p>
              <p className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">124</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800">
              <p className="text-gray-800 dark:text-gray-300 text-base font-medium leading-normal">Itens em Estoque</p>
              <p className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">98</p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-surface-dark border border-yellow-300/50 dark:border-yellow-500/50">
              <p className="text-gray-800 dark:text-gray-300 text-base font-medium leading-normal">Itens em Baixo Estoque</p>
              <div className="flex items-center gap-2">
                <p className="text-yellow-500 dark:text-yellow-400 tracking-light text-3xl font-bold leading-tight">15</p>
                <span className="material-symbols-outlined text-yellow-500 dark:text-yellow-400">warning</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800">
              <p className="text-gray-800 dark:text-gray-300 text-base font-medium leading-normal">Valor Total do Estoque</p>
              <p className="text-gray-900 dark:text-white tracking-light text-3xl font-bold leading-tight">R$ 8.450,00</p>
            </div>
          </section>

          {/* Table Section */}
          <section className="flex flex-col gap-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-8">
                  <button className="flex flex-col items-center justify-center border-b-[3px] border-b-primary text-gray-900 dark:text-white pb-3 pt-1">
                    <p className="text-sm font-bold leading-normal tracking-[0.015em]">Ingredientes</p>
                  </button>
                  <button className="flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 pb-3 pt-1">
                    <p className="text-sm font-bold leading-normal tracking-[0.015em]">Produtos Acabados</p>
                  </button>
                </div>
              </div>
              <div className="w-full sm:max-w-xs">
                <label className="flex flex-col min-w-40 h-11 w-full">
                  <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                    <div className="text-gray-500 dark:text-gray-400 flex border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-gray-900 items-center justify-center pl-3.5 rounded-l-lg border-r-0">
                      <span className="material-symbols-outlined">search</span>
                    </div>
                    <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-gray-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-gray-300 dark:border-gray-700 bg-background-light dark:bg-gray-900 h-full placeholder:text-gray-500 dark:placeholder:text-gray-400 px-4 rounded-l-none border-l-0 pl-2 text-sm font-normal leading-normal" placeholder="Buscar ingrediente..." />
                  </div>
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
                <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3" scope="col">Nome do Item</th>
                    <th className="px-6 py-3" scope="col">Categoria</th>
                    <th className="px-6 py-3" scope="col">Quantidade</th>
                    <th className="px-6 py-3" scope="col">Status</th>
                    <th className="px-6 py-3" scope="col">Última Atualização</th>
                    <th className="px-6 py-3" scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {INVENTORY_ITEMS.map(item => (
                    <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <th className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap" scope="row">{item.name}</th>
                      <td className="px-6 py-4">{item.category}</td>
                      <td className="px-6 py-4">{item.quantity}</td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 ${
                          item.status === 'In Stock' ? 'text-green-600 dark:text-green-400' :
                          item.status === 'Low Stock' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          <span className={`h-2 w-2 rounded-full ${
                             item.status === 'In Stock' ? 'bg-green-500' :
                             item.status === 'Low Stock' ? 'bg-yellow-400' :
                             'bg-red-500'
                          }`}></span>
                          <span>{item.status === 'In Stock' ? 'Em Estoque' : item.status === 'Low Stock' ? 'Baixo Estoque' : 'Crítico'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{item.lastUpdated}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <button className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><span className="material-symbols-outlined text-xl">edit</span></button>
                        <button className="p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><span className="material-symbols-outlined text-xl">history</span></button>
                        <button className="p-1.5 text-red-500 hover:text-red-700 rounded-md hover:bg-red-50 dark:hover:bg-red-900/50"><span className="material-symbols-outlined text-xl">delete</span></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default Inventory;
