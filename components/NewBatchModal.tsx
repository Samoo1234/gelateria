import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { productionService } from '../services/productionService';
import { useAuth } from '../contexts/AuthContext';
import { auditService } from '../services/auditService';
import {
  calculateFormulation,
  diagnoseRecipe,
  formatPtBrStock,
  extractTechnicalProfile
} from '../services/formulationEngine';
import {
  FormulationIngredientItem,
  FormulationTargets,
  TargetDiagnostic
} from '../types';

interface NewBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const NewBatchModal: React.FC<NewBatchModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [plannedQuantity, setPlannedQuantity] = useState<number>(10);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetchingRecipes, setFetchingRecipes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para autorização explícita de desvio técnico
  const [authorizeDeviation, setAuthorizeDeviation] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [deviationReason, setDeviationReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadRecipes();
    }
  }, [isOpen]);

  const loadRecipes = async () => {
    setFetchingRecipes(true);
    setError(null);
    try {
      const data = await productionService.getRecipesForProduction();
      setRecipes(data);
      if (data.length > 0) {
        setSelectedRecipeId(data[0].id);
        setPlannedQuantity(Number(data[0].yield || 10));
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar receitas.');
    } finally {
      setFetchingRecipes(false);
    }
  };

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

  // Análise técnico-química da fórmula selecionada em tempo de execução
  const { metrics, diagnostics, realBaseMassKg } = useMemo(() => {
    if (!selectedRecipe || !selectedRecipe.recipe_items) {
      return { metrics: null, diagnostics: [] as TargetDiagnostic[], realBaseMassKg: 10 };
    }

    const formulationItems: FormulationIngredientItem[] = selectedRecipe.recipe_items.map((it: any) => {
      const profile = extractTechnicalProfile(it.ingredients?.ingredient_technical_profiles);
      return {
        ingredientId: it.ingredient_id,
        ingredientName: it.ingredients?.name || 'Ingrediente',
        quantity: Number(it.quantity || 0),
        unit: it.unit,
        costPerUnit: Number(it.ingredients?.cost_per_unit || 0),
        isClosingIngredient: it.is_closing_ingredient,
        profile
      };
    });

    const targetG = Number(selectedRecipe.target_weight_g || 10000);
    const m = calculateFormulation(formulationItems, targetG);

    const targets: FormulationTargets = {
      targetWeightG: targetG,
      fatPct: selectedRecipe.target_fat_pct ? { target: Number(selectedRecipe.target_fat_pct), tolerance: Number(selectedRecipe.fat_tolerance_pct || 1.0) } : undefined,
      msnfPct: selectedRecipe.target_msnf_pct ? { target: Number(selectedRecipe.target_msnf_pct), tolerance: Number(selectedRecipe.msnf_tolerance_pct || 1.0) } : undefined,
      sugarPct: selectedRecipe.target_sugar_pct ? { target: Number(selectedRecipe.target_sugar_pct), tolerance: Number(selectedRecipe.sugar_tolerance_pct || 1.5) } : undefined,
      totalSolidsPct: selectedRecipe.target_total_solids_pct ? { target: Number(selectedRecipe.target_total_solids_pct), tolerance: Number(selectedRecipe.solids_tolerance_pct || 2.0) } : undefined,
      pod: selectedRecipe.target_pod ? { target: Number(selectedRecipe.target_pod), tolerance: Number(selectedRecipe.pod_tolerance || 1.5) } : undefined,
      pac: selectedRecipe.target_pac ? { target: Number(selectedRecipe.target_pac), tolerance: Number(selectedRecipe.pac_tolerance || 2.0) } : undefined,
    };

    const diag = diagnoseRecipe(m, targets);
    const calculatedMassKg = m.totalMassG > 0 ? Number((m.totalMassG / 1000).toFixed(3)) : Number(selectedRecipe.yield || 10);

    return { metrics: m, diagnostics: diag, realBaseMassKg: calculatedMassKg };
  }, [selectedRecipe]);

  // Se houver erro de dados técnicos (ex: falta de ficha técnica ou densidade de líquido), a batelada é terminantemente bloqueada
  const hasDataError = Boolean(
    !metrics ||
    metrics.hasDataError ||
    !metrics.isCalculationComplete ||
    (metrics.dataErrors && metrics.dataErrors.length > 0)
  );

  // Escala efetiva baseada na massa REAL validada dos insumos da receita
  const scaleRatio = !hasDataError && plannedQuantity > 0 && realBaseMassKg > 0 ? plannedQuantity / realBaseMassKg : 1;

  // Verificação de desvios técnicos em relação às tolerâncias (apenas desvios mensuráveis)
  const outOfBoundsDiagnostics = useMemo(() => {
    return diagnostics.filter((d) => d.status === 'OUT_OF_BOUNDS');
  }, [diagnostics]);

  const hasTechnicalDeviations = outOfBoundsDiagnostics.length > 0 || (metrics && !metrics.isBalanced && !hasDataError);

  // Verifica se todos os ingredientes possuem estoque suficiente na proporção real
  const ingredientStatus = (selectedRecipe?.recipe_items || []).map((item: any) => {
    const required = Number((item.quantity * scaleRatio).toFixed(3));
    const current = Number(item.ingredients?.current_stock || 0);
    const hasStock = current >= required;
    return {
      ...item,
      required,
      current,
      hasStock,
    };
  });

  const allIngredientsAvailable = ingredientStatus.every((i: any) => i.hasStock);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId) {
      setError('Selecione uma receita.');
      return;
    }
    if (plannedQuantity <= 0) {
      setError('A quantidade planejada deve ser maior que zero.');
      return;
    }

    // Bloqueio irrestrito quando faltarem dados cadastrais (erro de dados não contornável)
    if (hasDataError) {
      setError(`Bloqueio de produção: a fórmula possui dados incompletos (${metrics?.dataErrors?.join(', ') || 'densidade ou ficha técnica ausente'}). Não é permitido iniciar batelada com dados desconhecidos.`);
      return;
    }

    // Se houver desvio técnico mensurável, exige autorização explícita com PIN gerencial
    let authorizedByEmployeeId: string | null = null;
    if (hasTechnicalDeviations) {
      if (!authorizeDeviation) {
        setError('Esta fórmula possui desvios técnicos fora das tolerâncias. Para prosseguir, marque a autorização de desvio.');
        return;
      }
      if (!deviationReason.trim()) {
        setError('Informe a justificativa técnica obrigatória para autorizar a produção com desvio.');
        return;
      }
      if (!managerPin.trim()) {
        setError('Informe o PIN de Gerente/Administrador para autorizar o lote.');
        return;
      }

      // Validar PIN gerencial na tabela employees
      try {
        const { data: authEmployee, error: authError } = await supabase
          .from('employees')
          .select('id, name, role, status')
          .eq('pin_code', managerPin.trim())
          .eq('status', 'Active')
          .single();

        if (authError || !authEmployee) {
          setError('PIN gerencial incorreto ou colaborador inativo.');
          return;
        }

        const roleLower = (authEmployee.role || '').toLowerCase();
        const isManagerOrAdmin = roleLower.includes('admin') || roleLower.includes('gerente');
        if (!isManagerOrAdmin) {
          setError('Apenas Gerentes ou Administradores podem autorizar bateladas fora da tolerância técnica.');
          return;
        }
        authorizedByEmployeeId = authEmployee.id;
      } catch (authErr: any) {
        setError(authErr.message || 'Falha ao validar PIN gerencial.');
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const deviationDetails = hasTechnicalDeviations
        ? {
            authorized: true,
            authorizedBy: authorizedByEmployeeId,
            reason: deviationReason.trim()
          }
        : undefined;

      const created = await productionService.createBatch(
        selectedRecipeId,
        plannedQuantity,
        user?.id,
        notes || `Batelada iniciada por ${user?.name || 'Operador'}`,
        deviationDetails
      );

      // Registrar evento de segurança e auditoria se houve autorização de desvio
      if (hasTechnicalDeviations && authorizedByEmployeeId) {
        await auditService.logSecurityEvent(
          'PRODUCTION_DEVIATION_AUTHORIZED',
          'production_batches',
          created.id,
          {
            recipeId: selectedRecipeId,
            recipeName: selectedRecipe?.name,
            plannedQuantity,
            realBaseMassKg,
            deviations: outOfBoundsDiagnostics.map((d) => ({
              parameter: d.parameter,
              target: d.target,
              actual: d.actual,
              deviation: d.deviation,
              tolerance: d.tolerance
            })),
            reason: deviationReason.trim(),
            authorizedBy: authorizedByEmployeeId
          },
          authorizedByEmployeeId
        );
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao iniciar lote de fabricação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">precision_manufacturing</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display">
                Nova Ordem de Produção
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Inicie uma nova batelada de fábrica com escala física real e validação de tolerâncias
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Seleção de Receita & Quantidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Fórmula de Fabricação Elegível
              </label>
              {fetchingRecipes ? (
                <div className="h-11 flex items-center text-xs text-gray-500">
                  Carregando fórmulas elegíveis...
                </div>
              ) : recipes.length === 0 ? (
                <div className="h-11 flex items-center text-xs text-amber-500">
                  Nenhuma fórmula técnica de fabricação cadastrada. Cadastre em /recipes.
                </div>
              ) : (
                <select
                  value={selectedRecipeId}
                  onChange={(e) => {
                    setSelectedRecipeId(e.target.value);
                    const r = recipes.find((x) => x.id === e.target.value);
                    if (r) setPlannedQuantity(Number(r.yield || 10));
                    setAuthorizeDeviation(false);
                    setManagerPin('');
                    setDeviationReason('');
                  }}
                  className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.displayName || r.name || 'Fórmula sem nome'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Volume Planejado da Batelada (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="500"
                  value={plannedQuantity}
                  onChange={(e) => setPlannedQuantity(Number(e.target.value))}
                  className="w-full h-11 pl-3 pr-10 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  required
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-gray-400">
                  KG
                </span>
              </div>
            </div>
          </div>

          {/* Painel de Validação Física: Massa Base vs Volume Planejado */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                Massa Real da Composição Base:
              </span>
              <strong className="font-mono text-gray-900 dark:text-white">
                {formatPtBrStock(realBaseMassKg, 'kg', true)}
              </strong>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-gray-500 dark:text-gray-400">
                Fator de Escala Aplicado:
              </span>
              <strong className="font-mono text-primary font-bold">
                {scaleRatio.toFixed(3)}x ({plannedQuantity} kg / {realBaseMassKg.toFixed(3)} kg)
              </strong>
            </div>
          </div>

          {/* Diagnóstico de Tolerâncias Técnicas */}
          {diagnostics.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Diagnóstico Físico-Químico da Calda
                </h4>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    !hasTechnicalDeviations
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {!hasTechnicalDeviations ? '✓ Fórmula Calibrada' : '⚠️ Fora da Tolerância'}
                </span>
              </div>

              <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5 bg-gray-50/50 dark:bg-black/10">
                {diagnostics.map((d, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {d.parameter}
                    </span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-gray-400 text-[11px]">
                        Meta: {d.target} (±{d.tolerance})
                      </span>
                      <strong className="text-gray-900 dark:text-white">
                        Real: {d.actual}
                      </strong>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          d.status === 'OPTIMAL'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : d.status === 'ACCEPTABLE'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : d.status === 'PENDING'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}
                      >
                        {d.status === 'OPTIMAL'
                          ? 'Excelente'
                          : d.status === 'ACCEPTABLE'
                          ? 'Tolerável'
                          : d.status === 'PENDING'
                          ? 'Pendente'
                          : `Desvio (${d.deviation > 0 ? '+' : ''}${d.deviation})`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bloqueio Explícito por Erro de Dados Técnicos Incompletos */}
          {hasDataError && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 space-y-2">
              <div className="flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
                <span className="material-symbols-outlined text-lg mt-0.5 text-red-600 dark:text-red-400">
                  block
                </span>
                <div>
                  <p className="font-bold text-sm">Bloqueio de Produção: Dados Técnicos Incompletos</p>
                  <p className="mt-0.5 opacity-90">
                    Não é permitido escalar nem iniciar a produção desta fórmula porque existem erros de dados (ficha técnica ou densidade necessária ausente). Erros de dados não podem ser liberados por autorização excepcional de desvio.
                  </p>
                  {metrics?.dataErrors && metrics.dataErrors.length > 0 && (
                    <ul className="list-disc list-inside mt-2 space-y-1 font-mono text-[11px]">
                      {metrics.dataErrors.map((err, eIdx) => (
                        <li key={eIdx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Autorização Obrigatória de Desvio Técnico (Válida SOMENTE para desvio mensurável com dados completos) */}
          {hasTechnicalDeviations && !hasDataError && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <span className="material-symbols-outlined text-lg mt-0.5 text-amber-600 dark:text-amber-400">
                  warning
                </span>
                <div>
                  <p className="font-bold text-sm">Liberação Controlada de Batelada com Desvio</p>
                  <p className="mt-0.5 opacity-90">
                    A fórmula selecionada possui parâmetros fora das especificações (ex: teor de gordura ou balanço de massa). Para liberar a pesagem e fabricação, é obrigatória a autorização de um Gerente ou Administrador, com registro no log de auditoria.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200 dark:border-amber-800/30 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={authorizeDeviation}
                    onChange={(e) => setAuthorizeDeviation(e.target.checked)}
                    className="size-4 rounded text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    Autorizar início de batelada com desvio técnico excepcional
                  </span>
                </label>

                {authorizeDeviation && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        PIN de Autorização (Gerente / Admin) *
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={managerPin}
                        onChange={(e) => setManagerPin(e.target.value)}
                        placeholder="Digite o PIN"
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-black/30 border border-gray-300 dark:border-white/10 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Justificativa Técnica do Desvio *
                      </label>
                      <input
                        type="text"
                        value={deviationReason}
                        onChange={(e) => setDeviationReason(e.target.value)}
                        placeholder="Ex: Lote piloto para degustação / Calda com laudo aceito"
                        className="w-full h-9 px-3 rounded-lg bg-white dark:bg-black/30 border border-gray-300 dark:border-white/10 text-xs outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pesagem dos Insumos da Batelada */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Insumos Necessários na Bancada (Escala: {scaleRatio.toFixed(3)}x)
              </h4>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  allIngredientsAvailable
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {allIngredientsAvailable
                  ? '✓ Estoque Suficiente'
                  : '⚠️ Insumos insuficientes'}
              </span>
            </div>

            <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5 max-h-48 overflow-y-auto bg-gray-50/50 dark:bg-black/10">
              {ingredientStatus.length === 0 ? (
                <p className="p-4 text-xs text-center text-gray-400">
                  Nenhum ingrediente vinculado a esta receita.
                </p>
              ) : (
                ingredientStatus.map((item: any, idx: number) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-lg bg-gray-200 dark:bg-white/10 flex items-center justify-center font-bold text-[11px] text-gray-600 dark:text-gray-300">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {item.ingredients?.name || 'Ingrediente'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Disponível: {formatPtBrStock(item.current, item.unit)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-bold text-gray-900 dark:text-white">
                        {formatPtBrStock(item.required, item.unit, true)}
                      </p>
                      {!item.hasStock && (
                        <p className="text-[10px] font-semibold text-red-500">
                          Falta {formatPtBrStock(item.required - item.current, item.unit, true)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Observações / Instruções para o Gelatiere
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pasteurizar a 85°C e maturar a 4°C por 6 horas."
              className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || recipes.length === 0 || hasDataError || (hasTechnicalDeviations && (!authorizeDeviation || !managerPin.trim() || !deviationReason.trim()))}
              className="px-6 py-2.5 rounded-xl bg-primary text-gray-900 dark:text-black text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  Iniciar Batelada
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBatchModal;
