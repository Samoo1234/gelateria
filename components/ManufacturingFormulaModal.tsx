import React, { useState, useEffect, useMemo } from 'react';
import {
  BaseType,
  FormulationIngredientItem,
  FormulationTargets,
  IngredientTechnicalProfile
} from '../types';
import { ingredientTechnicalService } from '../services/ingredientTechnicalService';
import {
  calculateFormulation,
  calculateClosingIngredient,
  diagnoseRecipe,
  formatPtBrStock
} from '../services/formulationEngine';

interface ManufacturingFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  products?: any[];
  onSaveFormula: (formulaData: any) => Promise<boolean>;
}

export const ManufacturingFormulaModal: React.FC<ManufacturingFormulaModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  products = [],
  onSaveFormula
}) => {
  const [name, setName] = useState('');
  const [baseType, setBaseType] = useState<BaseType>('MILK');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [targetWeightG, setTargetWeightG] = useState<number>(10000);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number>(45);
  const [notes, setNotes] = useState<string>('');

  // Target metrics (Metas técnicas padrão de referência gelato / sorbet)
  const [targetFat, setTargetFat] = useState<number>(8.0);
  const [targetMsnf, setTargetMsnf] = useState<number>(10.5);
  const [targetSugar, setTargetSugar] = useState<number>(18.0);
  const [targetTotalSolids, setTargetTotalSolids] = useState<number>(36.5);
  const [targetPod, setTargetPod] = useState<number>(16.4);
  const [targetPac, setTargetPac] = useState<number>(27.5);

  // Ingredients from db with profiles
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Items in formula
  const [items, setItems] = useState<FormulationIngredientItem[]>([]);
  const [closingIngredientId, setClosingIngredientId] = useState<string>('');

  // Submission state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load ingredients with profiles
  useEffect(() => {
    if (isOpen) {
      loadIngredients();
    }
  }, [isOpen]);

  const loadIngredients = async () => {
    setLoadingIngredients(true);
    try {
      const data = await ingredientTechnicalService.getIngredientsWithProfiles();
      setAvailableIngredients(data);

      // Pre-seleção inteligente do ingrediente de fechamento padrão baseado no tipo de base
      if (items.length === 0) {
        if (baseType === 'MILK') {
          const leite = data.find((i) => i.name.toLowerCase().includes('leite integral'));
          if (leite) setClosingIngredientId(leite.id);
        } else {
          const agua = data.find((i) => i.name.toLowerCase().includes('água'));
          if (agua) setClosingIngredientId(agua.id);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar ingredientes:', err);
    } finally {
      setLoadingIngredients(false);
    }
  };

  // Ajusta metas padrão conforme muda o tipo de base
  const handleBaseTypeChange = (type: BaseType) => {
    setBaseType(type);
    if (type === 'WATER') {
      setTargetFat(0.5);
      setTargetMsnf(0.0);
      setTargetSugar(24.0);
      setTargetTotalSolids(26.0);
      setTargetPod(18.0);
      setTargetPac(24.0);
      const agua = availableIngredients.find((i) => i.name.toLowerCase().includes('água'));
      if (agua) setClosingIngredientId(agua.id);
    } else if (type === 'MILK') {
      setTargetFat(8.0);
      setTargetMsnf(10.5);
      setTargetSugar(18.0);
      setTargetTotalSolids(36.5);
      setTargetPod(16.4);
      setTargetPac(27.5);
      const leite = availableIngredients.find((i) => i.name.toLowerCase().includes('leite integral'));
      if (leite) setClosingIngredientId(leite.id);
    }
  };

  // Adiciona ingrediente à receita
  const handleAddIngredient = (ingredientId: string) => {
    if (!ingredientId) return;
    const ing = availableIngredients.find((i) => i.id === ingredientId);
    if (!ing) return;

    if (items.some((it) => it.ingredientId === ingredientId)) {
      return; // Já adicionado
    }

    const defaultQty = ing.unit === 'L' || ing.unit === 'kg' ? 1.0 : ing.unit === 'g' ? 100 : 1;
    const newItem: FormulationIngredientItem = {
      ingredientId: ing.id,
      ingredientName: ing.name,
      quantity: defaultQty,
      unit: ing.unit,
      costPerUnit: Number(ing.cost_per_unit || 0),
      profile: ing.profile,
      isClosingIngredient: ing.id === closingIngredientId
    };

    setItems([...items, newItem]);
  };

  // Remove ingrediente
  const handleRemoveIngredient = (ingredientId: string) => {
    setItems(items.filter((it) => it.ingredientId !== ingredientId));
    if (closingIngredientId === ingredientId) {
      setClosingIngredientId('');
    }
  };

  // Atualiza quantidade
  const handleQuantityChange = (ingredientId: string, qty: number) => {
    setItems(
      items.map((it) => (it.ingredientId === ingredientId ? { ...it, quantity: Math.max(0, qty) } : it))
    );
  };

  // Auto-cálculo do ingrediente de fechamento se estiver configurado
  const itemsWithClosing = useMemo(() => {
    if (!closingIngredientId) return items;
    const res = calculateClosingIngredient(items, targetWeightG, closingIngredientId);
    return res.updatedItems;
  }, [items, closingIngredientId, targetWeightG]);

  // Cálculo do balanço técnico com o Formulation Engine
  const metrics = useMemo(() => {
    return calculateFormulation(itemsWithClosing, targetWeightG);
  }, [itemsWithClosing, targetWeightG]);

  // Metas e diagnósticos de tolerância
  const targets: FormulationTargets = useMemo(() => ({
    targetWeightG,
    fatPct: { target: targetFat, tolerance: 1.0 },
    msnfPct: { target: targetMsnf, tolerance: 1.0 },
    sugarPct: { target: targetSugar, tolerance: 1.5 },
    totalSolidsPct: { target: targetTotalSolids, tolerance: 2.0 },
    pod: { target: targetPod, tolerance: 1.5 },
    pac: { target: targetPac, tolerance: 2.0 },
  }), [targetWeightG, targetFat, targetMsnf, targetSugar, targetTotalSolids, targetPod, targetPac]);

  const diagnostics = useMemo(() => {
    return diagnoseRecipe(metrics, targets);
  }, [metrics, targets]);

  const closingError = useMemo(() => {
    if (!closingIngredientId) return null;
    const res = calculateClosingIngredient(items, targetWeightG, closingIngredientId);
    return res.error || null;
  }, [items, closingIngredientId, targetWeightG]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Informe o nome da fórmula de fabricação.');
      return;
    }
    if (itemsWithClosing.length === 0) {
      setError('Adicione ao menos um ingrediente à fórmula.');
      return;
    }
    if (closingError) {
      setError(closingError);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        productId: selectedProductId || null,
        yieldKg: Number((targetWeightG / 1000).toFixed(2)),
        baseType,
        prepTime: prepTimeMinutes,
        totalCost: metrics.costTotal,
        targetWeightG,
        actualMassG: metrics.totalMassG,
        targetFatPct: targetFat,
        targetMsnfPct: targetMsnf,
        targetSugarPct: targetSugar,
        targetTotalSolidsPct: targetTotalSolids,
        targetPod,
        targetPac,
        calculatedMetrics: metrics,
        notes: notes || null,
        items: itemsWithClosing.map((it) => ({
          ingredientId: it.ingredientId,
          quantity: it.quantity,
          unit: it.unit,
          cost: Number(
            (
              (it.unit === 'g' || it.unit === 'ml'
                ? (it.quantity / 1000) * it.costPerUnit
                : it.quantity * it.costPerUnit)
            ).toFixed(2)
          ),
          isClosingIngredient: it.ingredientId === closingIngredientId
        }))
      };

      const success = await onSaveFormula(payload);
      if (success) {
        onSaved();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar fórmula técnica.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 p-6 sm:p-8 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">science</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white font-display">
                Nova Fórmula Técnica de Fabricação
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Calibração físico-química de caldas (Base, Sabor, Açaí ou Picolé) com POD & PAC
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
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Seção 1: Identificação e Parâmetros Base */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Nome da Fórmula *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Base Branca 10kg, Calda Açaí Especial, Mix Morango"
                required
                className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Base
              </label>
              <select
                value={baseType}
                onChange={(e) => handleBaseTypeChange(e.target.value as BaseType)}
                className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="MILK">Base Leite (Láctea)</option>
                <option value="WATER">Base Água (Sorbet / Frutas)</option>
                <option value="NEUTRAL">Neutra / Especial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Peso-Alvo da Batelada (g)
              </label>
              <input
                type="number"
                value={targetWeightG}
                onChange={(e) => setTargetWeightG(Number(e.target.value))}
                min={500}
                step={100}
                className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none font-mono"
              />
              <span className="text-[10px] text-gray-500">{(targetWeightG / 1000).toFixed(1)} kg de rendimento padrão</span>
            </div>
          </div>

          {/* Seção 2: Metas Técnicas Opcionais */}
          <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-black/20 border border-gray-200 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">tune</span> Metas de Balanceamento Técnico
              </span>
              <span className="text-[11px] text-gray-500">Indicadores de referência de formulação</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">Gordura %</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetFat}
                  onChange={(e) => setTargetFat(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">ESDL %</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetMsnf}
                  onChange={(e) => setTargetMsnf(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">Açúcares %</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetSugar}
                  onChange={(e) => setTargetSugar(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">Sólidos Totais %</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetTotalSolids}
                  onChange={(e) => setTargetTotalSolids(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">POD (Doçura)</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetPod}
                  onChange={(e) => setTargetPod(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-0.5">PAC (Anticong.)</label>
                <input
                  type="number"
                  step="0.1"
                  value={targetPac}
                  onChange={(e) => setTargetPac(Number(e.target.value))}
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Adicionar Ingredientes e Fechamento Dinâmico */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">scale</span>
                Composição de Ingredientes do Mix
              </h3>

              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    handleAddIngredient(e.target.value);
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="h-9 px-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-800 dark:text-gray-200 font-medium outline-none"
                >
                  <option value="" disabled>+ Adicionar Ingrediente...</option>
                  {availableIngredients
                    .filter((ing) => ing.profile?.is_mix_ingredient !== false)
                    .map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} ({ing.unit})
                      </option>
                    ))}
                </select>

                <div className="flex items-center gap-1.5 pl-3 border-l border-gray-200 dark:border-white/10">
                  <span className="text-xs text-gray-500">Fechamento:</span>
                  <select
                    value={closingIngredientId}
                    onChange={(e) => setClosingIngredientId(e.target.value)}
                    className="h-9 px-2.5 rounded-xl bg-primary/10 border border-primary/30 text-xs text-primary font-bold outline-none"
                  >
                    <option value="">Nenhum (Manual)</option>
                    {items.map((it) => (
                      <option key={it.ingredientId} value={it.ingredientId}>
                        {it.ingredientName} (Automático)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {closingError && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>{closingError}</span>
              </div>
            )}

            {/* Tabela de Insumos */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-black/30 border-b border-gray-200 dark:border-white/10 text-gray-500 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Ingrediente</th>
                    <th className="py-2.5 px-3 text-right">Quantidade</th>
                    <th className="py-2.5 px-3">Unid.</th>
                    <th className="py-2.5 px-3 text-right">Gordura %</th>
                    <th className="py-2.5 px-3 text-right">ESDL %</th>
                    <th className="py-2.5 px-3 text-right">Açúcar %</th>
                    <th className="py-2.5 px-3 text-right">POD</th>
                    <th className="py-2.5 px-3 text-right">PAC</th>
                    <th className="py-2.5 px-3 text-right">Custo</th>
                    <th className="py-2.5 px-2 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {itemsWithClosing.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-400">
                        Nenhum ingrediente adicionado. Selecione no menu acima.
                      </td>
                    </tr>
                  ) : (
                    itemsWithClosing.map((it) => {
                      const isClosing = it.ingredientId === closingIngredientId;
                      const prof = it.profile;
                      const costVal =
                        it.unit === 'g' || it.unit === 'ml'
                          ? (it.quantity / 1000) * it.costPerUnit
                          : it.quantity * it.costPerUnit;

                      return (
                        <tr
                          key={it.ingredientId}
                          className={`hover:bg-gray-50/50 dark:hover:bg-white/5 ${
                            isClosing ? 'bg-primary/5 font-semibold' : ''
                          }`}
                        >
                          <td className="py-2 px-3 flex items-center gap-1.5">
                            {it.ingredientName}
                            {isClosing && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
                                Fechamento
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isClosing ? (
                              <span className="font-mono text-primary font-bold">
                                {it.quantity}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="any"
                                value={it.quantity}
                                onChange={(e) => handleQuantityChange(it.ingredientId, Number(e.target.value))}
                                className="w-20 text-right px-2 py-1 rounded bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs font-mono"
                              />
                            )}
                          </td>
                          <td className="py-2 px-3 text-gray-500 font-mono">{it.unit}</td>
                          <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                            {prof?.fat_pct ?? '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                            {prof?.msnf_pct ?? '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                            {((prof?.sucrose_pct || 0) + (prof?.other_sugars_pct || 0)).toFixed(1)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                            {prof?.pod_factor ?? '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                            {prof?.pac_factor ?? '-'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-900 dark:text-white">
                            R$ {costVal.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredient(it.ingredientId)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Seção 4: Diagnóstico Visual do Balanço da Fórmula */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-500">analytics</span>
                Diagnóstico & Balanço da Calda ({metrics.totalMassG}g / {targetWeightG}g)
              </span>

              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">
                  Custo Total: <strong className="text-gray-900 dark:text-white font-mono">R$ {metrics.costTotal.toFixed(2).replace('.', ',')}</strong>
                </span>
                <span className="text-gray-500">
                  Custo/kg: <strong className="text-primary font-mono">R$ {metrics.costPerKg.toFixed(2).replace('.', ',')}/kg</strong>
                </span>
              </div>
            </div>

            {/* Diagnósticos de desvio das metas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {diagnostics.map((d) => (
                <div
                  key={d.parameter}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                    d.status === 'OPTIMAL'
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40'
                      : d.status === 'ACCEPTABLE'
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800/40'
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/40'
                  }`}
                >
                  <span className="text-[10px] text-gray-500 font-semibold">{d.parameter}</span>
                  <div className="my-1 flex items-baseline justify-between">
                    <span className="text-sm font-black font-mono text-gray-900 dark:text-white">
                      {d.actual.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">meta {d.target}</span>
                  </div>
                  <div className="text-[10px] flex items-center justify-between font-mono">
                    <span className={d.deviation > 0 ? 'text-amber-600' : 'text-blue-600'}>
                      {d.deviation > 0 ? `+${d.deviation}` : d.deviation}
                    </span>
                    <span className="text-gray-400">tol ±{d.tolerance}</span>
                  </div>
                </div>
              ))}
            </div>

            {metrics.missingFactors.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span> Propriedades Pendentes de Homologação:
                </span>
                <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                  {metrics.missingFactors.map((m, idx) => (
                    <li key={idx}>
                      <strong>{m.ingredientName}</strong>: {m.missingProperties.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer de Ações */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || Boolean(closingError) || itemsWithClosing.length === 0}
              className="px-6 py-2.5 rounded-xl bg-primary text-gray-900 dark:text-black text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {saving ? 'Gravando Fórmula...' : 'Salvar Fórmula de Fabricação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
