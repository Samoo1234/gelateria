import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import NewBatchModal from '../components/NewBatchModal';
import CompleteBatchModal from '../components/CompleteBatchModal';
import { productionService, ProductionBatchRow } from '../services/productionService';
import { useAuth } from '../contexts/AuthContext';

const Production: React.FC = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState<ProductionBatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [selectedBatchForComplete, setSelectedBatchForComplete] = useState<ProductionBatchRow | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await productionService.getBatches();
      setBatches(data);
    } catch (err) {
      console.error('Erro ao carregar lotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBatch = async (batch: ProductionBatchRow) => {
    const reason = window.prompt(`Motivo do cancelamento do lote ${batch.batch_code}:`);
    if (reason === null) return; // Cancelou prompt

    try {
      await productionService.cancelBatch(batch.id, user?.id, reason);
      loadBatches();
    } catch (err: any) {
      alert(`Erro ao cancelar lote: ${err.message}`);
    }
  };

  // Filtragem
  const filteredBatches = batches.filter((b) => {
    const matchesFilter = filter === 'ALL' || b.status === filter;
    const matchesSearch =
      b.batch_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.recipes?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Métricas
  const activeBatchesCount = batches.filter((b) => b.status === 'IN_PROGRESS').length;
  const completedBatches = batches.filter((b) => b.status === 'COMPLETED');
  const totalProducedKg = completedBatches.reduce((acc, b) => acc + (b.produced_quantity || 0), 0);
  const totalLossKg = completedBatches.reduce((acc, b) => acc + (b.loss_quantity || 0), 0);
  const avgEfficiency =
    completedBatches.length > 0
      ? (
          (totalProducedKg /
            Math.max(
              1,
              completedBatches.reduce((acc, b) => acc + (b.planned_quantity || 0), 0)
            )) *
          100
        ).toFixed(1)
      : '100';

  return (
    <Layout>
      <div className="p-6 lg:p-8 h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display tracking-tight">
                Fabricação & Bateladas (PCP)
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Controle operacional de produção, pesagem de insumos e geração de cubas.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadBatches}
                className="p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                title="Atualizar dados"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
              </button>

              <button
                onClick={() => setIsNewBatchOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-primary text-gray-900 dark:text-black font-bold text-sm tracking-wide hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Nova Ordem de Produção
              </button>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">hourglass_top</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Bateladas Ativas</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
                  {activeBatchesCount}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">scale</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Produzido</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {totalProducedKg.toFixed(1)} kg
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">speed</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Rendimento Médio</p>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                  {avgEfficiency}%
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">delete_sweep</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Perdas Totais</p>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                  {totalLossKg.toFixed(2)} kg
                </p>
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white dark:bg-surface-dark rounded-2xl border border-gray-200/80 dark:border-white/10">
            <div className="flex items-center gap-1">
              {(['ALL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filter === tab
                      ? 'bg-primary text-gray-900 dark:text-black shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'ALL' && 'Todas'}
                  {tab === 'IN_PROGRESS' && 'Em Andamento'}
                  {tab === 'COMPLETED' && 'Concluídas'}
                  {tab === 'CANCELLED' && 'Canceladas'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-lg">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar lote ou sabor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Lista de Ordens de Produção */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
                <p className="text-xs text-gray-500">Carregando ordens de produção...</p>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">
                  skillet
                </span>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Nenhuma ordem de produção encontrada
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Clique no botão "Nova Ordem de Produção" para iniciar uma batelada.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-white/10">
                    <tr>
                      <th className="p-4">Código / Sabor</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Planejado</th>
                      <th className="p-4">Produzido</th>
                      <th className="p-4">Operador</th>
                      <th className="p-4">Início</th>
                      <th className="p-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                    {filteredBatches.map((batch) => (
                      <tr
                        key={batch.id}
                        className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-mono font-bold text-gray-900 dark:text-white">
                            {batch.batch_code}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            {batch.recipes?.name || 'Gelato Artesanal'}
                          </p>
                        </td>

                        <td className="p-4">
                          {batch.status === 'IN_PROGRESS' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Em Produção
                            </span>
                          )}
                          {batch.status === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Concluído
                            </span>
                          )}
                          {batch.status === 'CANCELLED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300">
                              Cancelado
                            </span>
                          )}
                        </td>

                        <td className="p-4 font-mono font-bold text-gray-700 dark:text-gray-300">
                          {batch.planned_quantity} kg
                        </td>

                        <td className="p-4">
                          {batch.status === 'COMPLETED' ? (
                            <div>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {batch.produced_quantity} kg
                              </span>
                              {Boolean(batch.loss_quantity) && (
                                <span className="block text-[10px] text-rose-500">
                                  perda: {batch.loss_quantity} kg
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Pendente</span>
                          )}
                        </td>

                        <td className="p-4 text-gray-600 dark:text-gray-300">
                          {batch.employees?.name || 'Operador'}
                        </td>

                        <td className="p-4 text-gray-500 dark:text-gray-400 text-[11px]">
                          {batch.started_at
                            ? new Date(batch.started_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </td>

                        <td className="p-4 text-right">
                          {batch.status === 'IN_PROGRESS' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedBatchForComplete(batch)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                              >
                                <span className="material-symbols-outlined text-sm">check</span>
                                Concluir
                              </button>

                              <button
                                onClick={() => handleCancelBatch(batch)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Cancelar Lote"
                              >
                                <span className="material-symbols-outlined text-base">close</span>
                              </button>
                            </div>
                          )}

                          {batch.status === 'COMPLETED' && (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                              <span className="material-symbols-outlined text-sm">inventory_2</span>
                              Cubas geradas
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modais */}
      {isNewBatchOpen && (
        <NewBatchModal
          isOpen={isNewBatchOpen}
          onClose={() => setIsNewBatchOpen(false)}
          onCreated={loadBatches}
        />
      )}

      {selectedBatchForComplete && (
        <CompleteBatchModal
          isOpen={Boolean(selectedBatchForComplete)}
          batch={selectedBatchForComplete}
          onClose={() => setSelectedBatchForComplete(null)}
          onCompleted={loadBatches}
        />
      )}
    </Layout>
  );
};

export default Production;
