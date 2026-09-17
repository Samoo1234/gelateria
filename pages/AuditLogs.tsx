import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { auditService, AuditLogItem } from '../services/auditService';
import { orderService } from '../services/orderService';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar, 
  User, 
  Clock, 
  AlertCircle, 
  FileText,
  Scale,
  DollarSign,
  TrendingDown,
  Layers,
  ArrowRight
} from 'lucide-react';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [logsData, employeesData] = await Promise.all([
        auditService.getAuditLogs({
          action: selectedAction || undefined,
          employeeId: selectedEmployeeId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }, 150),
        orderService.getCashiers()
      ]);

      setLogs(logsData);
      setEmployees(employeesData);
    } catch (err) {
      console.error('Erro ao carregar logs de auditoria:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAction, selectedEmployeeId, startDate, endDate]);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const actionMatch = log.action.toLowerCase().includes(q);
    const entityMatch = log.entity.toLowerCase().includes(q);
    const employeeMatch = log.employees?.name?.toLowerCase().includes(q);
    const detailsMatch = JSON.stringify(log.details).toLowerCase().includes(q);
    return actionMatch || entityMatch || employeeMatch || detailsMatch;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'FINALIZAR_VENDA':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Venda Concluída</span>;
      case 'SALE_CANCEL':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">Venda Cancelada</span>;
      case 'TUB_RECONCILIATION':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">Reconciliação Cuba</span>;
      case 'PRODUCTION_COMPLETE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">Lote Concluído</span>;
      case 'MANUAL_WEIGHT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">Peso Manual</span>;
      case 'CASH_OPEN':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">Abertura Caixa</span>;
      case 'CASH_CLOSE':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">Fechamento Caixa</span>;
      case 'CASH_WITHDRAWAL':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">Sangria Caixa</span>;
      case 'CASH_SUPPLY':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">Suprimento Caixa</span>;
      case 'RECEIPT_REPRINT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">Reimpressão</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{action}</span>;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-7 text-primary" />
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Auditoria Operacional & Rastreabilidade
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Registro contínuo e imutável de todas as ações sensíveis no PDV, estoque e produção.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar Logs</span>
          </button>
        </div>

        {/* Barra de Filtros */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            
            {/* Filtro de Ação */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Tipo de Ação
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">Todas as Ações</option>
                <option value="FINALIZAR_VENDA">Finalizar Venda</option>
                <option value="SALE_CANCEL">Cancelamento de Venda</option>
                <option value="TUB_RECONCILIATION">Reconciliação de Cuba</option>
                <option value="PRODUCTION_COMPLETE">Conclusão de Produção</option>
                <option value="MANUAL_WEIGHT">Peso Manual / Balança</option>
                <option value="CASH_OPEN">Abertura de Caixa</option>
                <option value="CASH_CLOSE">Fechamento de Caixa</option>
                <option value="CASH_WITHDRAWAL">Sangria</option>
                <option value="CASH_SUPPLY">Suprimento</option>
                <option value="RECEIPT_REPRINT">Reimpressão Comprovante</option>
              </select>
            </div>

            {/* Filtro de Operador */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Operador / Funcionário
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">Todos os Operadores</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Busca por texto */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID do pedido, motivo, código de cuba, detalhes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Tabela de Logs */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-surface-dark/90 text-xs font-bold text-gray-500 uppercase border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Data / Hora</th>
                  <th className="px-6 py-4">Operador</th>
                  <th className="px-6 py-4">Ação</th>
                  <th className="px-6 py-4">Entidade</th>
                  <th className="px-6 py-4">Detalhes Operacionais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="size-6 animate-spin text-primary" />
                        <span>Carregando trilha de auditoria...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Nenhum evento de auditoria localizado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      
                      {/* Data / Hora */}
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        <div className="font-bold text-gray-800 dark:text-gray-200">
                          {new Date(log.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </td>

                      {/* Operador */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {log.employees?.name || 'Sistema / Auto'}
                        </div>
                        {log.employees?.role && (
                          <div className="text-xs text-gray-400">
                            {log.employees.role}
                          </div>
                        )}
                      </td>

                      {/* Ação */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Entidade */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span className="font-bold text-gray-700 dark:text-gray-300 uppercase">
                          {log.entity}
                        </span>
                        {log.entity_id && (
                          <div className="text-gray-400 truncate max-w-[120px]" title={log.entity_id}>
                            #{log.entity_id.slice(0, 8)}
                          </div>
                        )}
                      </td>

                      {/* Detalhes formatados */}
                      <td className="px-6 py-4 text-xs">
                        {log.details ? (
                          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 font-mono text-[11px] text-gray-700 dark:text-gray-300 max-w-xl break-all">
                            {Object.entries(log.details).map(([key, val]) => (
                              <span key={key} className="mr-3 inline-block">
                                <strong className="text-gray-900 dark:text-white">{key}:</strong>{' '}
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default AuditLogs;
