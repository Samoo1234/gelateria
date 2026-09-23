import {
  UnitType,
  FormulationIngredientItem,
  FormulationCalculatedMetrics,
  FormulationTargets,
  TargetDiagnostic,
  PricingMetrics
} from '../types';

/**
 * Converte qualquer quantidade e unidade para gramas internamente com validação estrita.
 * Litros (L) e Mililitros (ml) SÓ podem ser convertidos se houver densidade válida (g/ml).
 */
export function normalizeMassInGrams(
  quantity: number,
  unit: UnitType,
  densityGPerMl?: number | null
): { grams: number; error?: string } {
  if (quantity < 0) {
    return { grams: 0, error: 'Quantidade não pode ser negativa.' };
  }

  switch (unit) {
    case 'g':
      return { grams: quantity };
    case 'kg':
      return { grams: quantity * 1000 };
    case 'ml': {
      if (!densityGPerMl || densityGPerMl <= 0) {
        return {
          grams: 0,
          error: 'Conversão de ml para gramas requer densidade válida (g/ml).'
        };
      }
      return { grams: quantity * densityGPerMl };
    }
    case 'L': {
      if (!densityGPerMl || densityGPerMl <= 0) {
        return {
          grams: 0,
          error: 'Conversão de Litros (L) para gramas requer densidade válida (g/ml).'
        };
      }
      return { grams: quantity * 1000 * densityGPerMl };
    }
    case 'un':
      return {
        grams: 0,
        error: 'Unidade "un" (descartável/embalagem) não possui massa contínua no mix técnico.'
      };
    default:
      return { grams: 0, error: `Unidade desconhecida: ${unit}` };
  }
}

/**
 * Converte gramas para a unidade de exibição original do ingrediente.
 */
export function convertGramsToUnit(
  grams: number,
  unit: UnitType,
  densityGPerMl?: number | null
): number {
  switch (unit) {
    case 'g':
      return Number(grams.toFixed(3));
    case 'kg':
      return Number((grams / 1000).toFixed(3));
    case 'ml': {
      const d = densityGPerMl && densityGPerMl > 0 ? densityGPerMl : 1.0;
      return Number((grams / d).toFixed(3));
    }
    case 'L': {
      const d = densityGPerMl && densityGPerMl > 0 ? densityGPerMl : 1.0;
      return Number((grams / (1000 * d)).toFixed(3));
    }
    case 'un':
      return Math.round(grams);
  }
}

/**
 * Motor central de formulação técnica pura de sorvetes, açaí e picolés.
 * Calcula frações, componentes, consistência física, POD e PAC por 100g de mistura.
 */
export function calculateFormulation(
  items: FormulationIngredientItem[],
  targetWeightG: number = 10000
): FormulationCalculatedMetrics {
  let totalMassG = 0;
  let totalFatG = 0;
  let totalMsnfG = 0;
  let totalSugarG = 0;
  let totalSolidsG = 0;
  let totalWaterG = 0;
  let weightedPodSum = 0;
  let weightedPacSum = 0;
  let costTotal = 0;

  const missingFactors: { ingredientName: string; missingProperties: string[] }[] = [];

  for (const item of items) {
    // Itens que não entram no mix (ex: casquinha, copo, colher) são desconsiderados na composição física
    if (item.profile && item.profile.is_mix_ingredient === false) {
      continue;
    }

    const density = item.profile?.density_g_ml || (item.unit === 'L' || item.unit === 'ml' ? 1.0 : undefined);
    const { grams, error } = normalizeMassInGrams(item.quantity, item.unit, density);

    if (error || grams <= 0) {
      continue;
    }

    totalMassG += grams;

    // Custo proporcional do ingrediente
    let itemCost = 0;
    if (item.unit === 'kg' || item.unit === 'L') {
      itemCost = item.quantity * item.costPerUnit;
    } else if (item.unit === 'g') {
      itemCost = (item.quantity / 1000) * item.costPerUnit;
    } else if (item.unit === 'ml') {
      itemCost = (item.quantity / 1000) * item.costPerUnit;
    } else {
      itemCost = item.quantity * item.costPerUnit;
    }
    costTotal += itemCost;

    const prof = item.profile;
    const missing: string[] = [];

    if (!prof) {
      missingFactors.push({
        ingredientName: item.ingredientName,
        missingProperties: ['Perfil técnico completo não cadastrado']
      });
      continue;
    }

    if (prof.data_status === 'MISSING') {
      missing.push('Propriedades técnicas ausentes ou não validadas');
    }

    // Componentes em gramas deste ingrediente
    const fatG = grams * (Number(prof.fat_pct || 0) / 100);
    const msnfG = grams * (Number(prof.msnf_pct || 0) / 100); // ESDL
    const sucroseG = grams * (Number(prof.sucrose_pct || 0) / 100);
    const otherSugarsG = grams * (Number(prof.other_sugars_pct || 0) / 100);
    const sugarG = sucroseG + otherSugarsG;

    // Sólidos Totais: calculados a partir da ficha do ingrediente
    let solidsG = grams * (Number(prof.total_solids_pct || 0) / 100);
    // Se total_solids_pct for 0 mas houver gordura/açúcar/esdl, derivação coerente
    if (solidsG === 0 && (fatG > 0 || msnfG > 0 || sugarG > 0)) {
      solidsG = fatG + msnfG + sugarG;
    }

    const waterG = grams * (Number(prof.water_pct || 0) / 100);

    totalFatG += fatG;
    totalMsnfG += msnfG;
    totalSugarG += sugarG;
    totalSolidsG += solidsG;
    totalWaterG += waterG;

    // Fatores de POD e PAC relativos à sacarose (sacarose = 1.00 ou 100)
    // Se o fator na base estiver em base 100 (ex: 73 para dextrose), normaliza para fração 0.73
    let podFactor = Number(prof.pod_factor || 0);
    if (podFactor > 5) podFactor = podFactor / 100; // Normaliza base 100 para base 1.00

    let pacFactor = Number(prof.pac_factor || 0);
    if (Math.abs(pacFactor) > 5) pacFactor = pacFactor / 100; // Normaliza base 100 para base 1.00

    // Verificação de fatores ausentes em ingredientes açucarados ou lácteos
    if ((sugarG > 0 || msnfG > 0) && podFactor === 0 && sucroseG > 0) {
      podFactor = 1.0; // Fallback sacarose
    }

    if (sugarG > 0 && podFactor === 0 && prof.data_status !== 'CONFIRMED') {
      missing.push('Fator POD não validado');
    }
    if ((sugarG > 0 || msnfG > 0) && pacFactor === 0 && prof.data_status !== 'CONFIRMED') {
      missing.push('Fator PAC não validado');
    }

    if (missing.length > 0) {
      missingFactors.push({
        ingredientName: item.ingredientName,
        missingProperties: missing
      });
    }

    // Contribuição para POD e PAC em massa equivalente de sacarose
    weightedPodSum += grams * podFactor;
    weightedPacSum += grams * pacFactor;
  }

  // Cálculos percentuais por 100g de mix total
  const fatPct = totalMassG > 0 ? (totalFatG / totalMassG) * 100 : 0;
  const msnfPct = totalMassG > 0 ? (totalMsnfG / totalMassG) * 100 : 0;
  const sugarPct = totalMassG > 0 ? (totalSugarG / totalMassG) * 100 : 0;
  const totalSolidsPct = totalMassG > 0 ? (totalSolidsG / totalMassG) * 100 : 0;
  const waterPct = totalMassG > 0 ? (totalWaterG / totalMassG) * 100 : 0;

  // POD e PAC por 100g da mistura: (100 / M) * soma(q_i * fator_relativo_sacarose)
  const pod = totalMassG > 0 ? (100 / totalMassG) * weightedPodSum : 0;
  const pac = totalMassG > 0 ? (100 / totalMassG) * weightedPacSum : 0;

  const costPerKg = totalMassG > 0 ? (costTotal / totalMassG) * 1000 : 0;

  // Formulação é considerada balanceada se atingiu o peso-alvo e não possui fatores críticos ausentes
  const isBalanced =
    Math.abs(totalMassG - targetWeightG) <= 5 && missingFactors.length === 0;

  return {
    totalMassG: Number(totalMassG.toFixed(2)),
    totalFatG: Number(totalFatG.toFixed(2)),
    fatPct: Number(fatPct.toFixed(2)),
    totalMsnfG: Number(totalMsnfG.toFixed(2)),
    msnfPct: Number(msnfPct.toFixed(2)),
    totalSugarG: Number(totalSugarG.toFixed(2)),
    sugarPct: Number(sugarPct.toFixed(2)),
    totalSolidsG: Number(totalSolidsG.toFixed(2)),
    totalSolidsPct: Number(totalSolidsPct.toFixed(2)),
    waterPct: Number(waterPct.toFixed(2)),
    pod: Number(pod.toFixed(2)),
    pac: Number(pac.toFixed(2)),
    costTotal: Number(costTotal.toFixed(2)),
    costPerKg: Number(costPerKg.toFixed(2)),
    missingFactors,
    isBalanced
  };
}

/**
 * Calcula dinamicamente a quantidade do ingrediente de fechamento (Água ou Leite).
 * Regra: Q_fechamento = Peso_Alvo - Soma(TODOS os outros ingredientes).
 * CORREÇÃO: Inclui expressamente o 1º ingrediente da lista (que era ignorado no Excel).
 * Bloqueia resultado negativo e recalcula a fração exata na unidade do ingrediente.
 */
export function calculateClosingIngredient(
  items: FormulationIngredientItem[],
  targetWeightG: number,
  closingIngredientId: string
): {
  closingQuantity: number;
  closingGrams: number;
  updatedItems: FormulationIngredientItem[];
  error?: string;
} {
  const closingItemIndex = items.findIndex((i) => i.ingredientId === closingIngredientId);
  if (closingItemIndex === -1) {
    return {
      closingQuantity: 0,
      closingGrams: 0,
      updatedItems: items,
      error: 'Ingrediente de fechamento não encontrado na receita.'
    };
  }

  const closingItem = items[closingItemIndex];
  const density = closingItem.profile?.density_g_ml || (closingItem.unit === 'L' || closingItem.unit === 'ml' ? 1.0 : 1.0);

  // Soma a massa de TODOS os outros ingredientes em gramas, começando do índice 0!
  let sumOtherGrams = 0;
  for (let idx = 0; idx < items.length; idx++) {
    if (idx === closingItemIndex) continue;
    const it = items[idx];
    if (it.profile && it.profile.is_mix_ingredient === false) continue;

    const itDensity = it.profile?.density_g_ml || (it.unit === 'L' || it.unit === 'ml' ? 1.0 : undefined);
    const { grams } = normalizeMassInGrams(it.quantity, it.unit, itDensity);
    sumOtherGrams += grams;
  }

  const remainingGrams = targetWeightG - sumOtherGrams;

  if (remainingGrams < 0) {
    return {
      closingQuantity: 0,
      closingGrams: 0,
      updatedItems: items,
      error: `Os ingredientes inseridos (${(sumOtherGrams / 1000).toFixed(2)} kg) já ultrapassam o peso-alvo (${(targetWeightG / 1000).toFixed(2)} kg). Reduza os outros insumos.`
    };
  }

  const closingQuantity = convertGramsToUnit(remainingGrams, closingItem.unit, density);

  const updatedItems = items.map((it, idx) => {
    if (idx === closingItemIndex) {
      return {
        ...it,
        quantity: closingQuantity,
        isClosingIngredient: true
      };
    }
    return {
      ...it,
      isClosingIngredient: false
    };
  });

  return {
    closingQuantity,
    closingGrams: remainingGrams,
    updatedItems
  };
}

/**
 * Diagnóstico comparativo entre os valores calculados da fórmula e as metas desejadas.
 * Identifica desvios e tolerâncias sem mascarar divergências.
 */
export function diagnoseRecipe(
  metrics: FormulationCalculatedMetrics,
  targets: FormulationTargets
): TargetDiagnostic[] {
  const diagnostics: TargetDiagnostic[] = [];

  const checkParam = (
    parameter: string,
    actual: number,
    targetConfig?: { target: number; tolerance: number }
  ) => {
    if (!targetConfig) return;
    const { target, tolerance } = targetConfig;
    const deviation = Number((actual - target).toFixed(2));
    const isWithinTolerance = Math.abs(deviation) <= tolerance;
    let status: 'OPTIMAL' | 'ACCEPTABLE' | 'OUT_OF_BOUNDS' = 'OUT_OF_BOUNDS';

    if (Math.abs(deviation) <= tolerance * 0.5) {
      status = 'OPTIMAL';
    } else if (isWithinTolerance) {
      status = 'ACCEPTABLE';
    }

    diagnostics.push({
      parameter,
      target,
      actual,
      deviation,
      tolerance,
      isWithinTolerance,
      status
    });
  };

  checkParam('Gordura (%)', metrics.fatPct, targets.fatPct);
  checkParam('ESDL (%)', metrics.msnfPct, targets.msnfPct);
  checkParam('Açúcares (%)', metrics.sugarPct, targets.sugarPct);
  checkParam('Sólidos Totais (%)', metrics.totalSolidsPct, targets.totalSolidsPct);
  checkParam('POD (Poder Edulcorante)', metrics.pod, targets.pod);
  checkParam('PAC (Poder Anticongelante)', metrics.pac, targets.pac);

  return diagnostics;
}

/**
 * Cálculos rigorosos de precificação financeira.
 * Separação estrita de Multiplicador, Markup percentual e Margem de Lucro percentual.
 * Evita o erro da planilha onde multiplicador 6,6 era chamado de margem 6,6%.
 */
export function calculatePricingMetrics(cost: number, price: number): PricingMetrics {
  const validCost = Math.max(0, cost);
  const validPrice = Math.max(0, price);

  const profit = validPrice - validCost;
  const multiplier = validCost > 0 ? Number((validPrice / validCost).toFixed(2)) : 0;
  const markupPct = validCost > 0 ? Number(((profit / validCost) * 100).toFixed(1)) : 0;
  const marginPct = validPrice > 0 ? Number(((profit / validPrice) * 100).toFixed(1)) : 0;

  return {
    cost: Number(validCost.toFixed(2)),
    price: Number(validPrice.toFixed(2)),
    multiplier,
    markupPct,
    marginPct,
    profit: Number(profit.toFixed(2))
  };
}

/**
 * Formatação inequívoca de quantidade e estoque em português brasileiro.
 * Exibe '50 L' ou '50,000 L' conforme a precisão sem induzir à leitura de 50 mil.
 */
export function formatPtBrStock(quantity: number, unit: string, forceDecimals: boolean = false): string {
  const num = Number(quantity || 0);
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: forceDecimals ? 3 : (num % 1 === 0 ? 0 : 3),
    maximumFractionDigits: 3
  }).format(num);

  return `${formatted} ${unit}`;
}
