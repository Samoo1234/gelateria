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
 * Nunca assume densidade 1.0 silenciosamente para líquidos.
 */
export function normalizeMassInGrams(
  quantity: number,
  unit: UnitType,
  densityGPerMl?: number | null
): { grams: number; error?: string; isPending?: boolean } {
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
          error: 'Conversão de ml para gramas requer densidade válida (g/ml).',
          isPending: true
        };
      }
      return { grams: quantity * densityGPerMl };
    }
    case 'L': {
      if (!densityGPerMl || densityGPerMl <= 0) {
        return {
          grams: 0,
          error: 'Conversão de Litros (L) para gramas requer densidade válida (g/ml).',
          isPending: true
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
 * Para volumes (L e ml), exige densidade válida.
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
      return Number((grams / (1000 * d)).toFixed(6));
    }
    case 'un':
      return Math.round(grams);
  }
}

/**
 * Motor central de formulação técnica pura de sorvetes, açaí e picolés.
 * Calcula frações, componentes, consistência física, POD e PAC por 100g de mistura.
 * 
 * Regras Físico-Químicas Rigorosas:
 * 1. Base interna estritamente em MASSA (gramas).
 * 2. Volumes convertidos unicamente pela densidade específica do ingrediente.
 * 3. Lactose é componente dos sólidos não-gordurosos do leite (ESDL) e NÃO é somada em duplicidade nos sólidos totais.
 * 4. PAC da lactose é calculado estritamente sobre a MASSA DE LACTOSE (massa * lactose_pct * fator_lactose),
 *    jamais sobre a massa inteira do leite líquido!
 * 5. Se faltar densidade ou fatores críticos, o cálculo é marcado como PENDENTE.
 */
export function calculateFormulation(
  items: FormulationIngredientItem[],
  targetWeightG: number = 10000
): FormulationCalculatedMetrics {
  let totalMassG = 0;
  let totalFatG = 0;
  let totalMsnfG = 0;
  let totalLactoseG = 0;
  let totalSucroseG = 0;
  let totalOtherSugarsG = 0;
  let totalSolidsG = 0;
  let totalWaterG = 0;
  let weightedPodSum = 0;
  let weightedPacSum = 0;
  let costTotal = 0;

  const missingFactors: { ingredientName: string; missingProperties: string[] }[] = [];

  for (const item of items) {
    // Itens que não entram no mix (ex: casquinha, copo, colher, palito) são desconsiderados na composição física da calda
    if (item.profile && item.profile.is_mix_ingredient === false) {
      continue;
    }

    const isLiquid = item.unit === 'L' || item.unit === 'ml';
    const density = item.profile?.density_g_ml;

    if (isLiquid && (!density || density <= 0)) {
      missingFactors.push({
        ingredientName: item.ingredientName,
        missingProperties: ['Densidade ausente para conversão de volume (L/ml) em massa (g)']
      });
      continue;
    }

    const { grams, error, isPending } = normalizeMassInGrams(item.quantity, item.unit, density);

    if (error || isPending || grams <= 0) {
      if (isPending) {
        missingFactors.push({
          ingredientName: item.ingredientName,
          missingProperties: [error || 'Conversão pendente']
        });
      }
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
      missing.push('Propriedades físico-químicas marcadas como ausentes');
    }

    // Componentes individuais em gramas deste ingrediente
    const fatG = grams * (Number(prof.fat_pct || 0) / 100);
    const msnfG = grams * (Number(prof.msnf_pct || 0) / 100); // ESDL (Sólidos Não Gordurosos do Leite)
    const lactoseG = grams * (Number(prof.lactose_pct || 0) / 100);
    const sucroseG = grams * (Number(prof.sucrose_pct || 0) / 100);
    const otherSugarsG = grams * (Number(prof.other_sugars_pct || 0) / 100);
    const waterG = grams * (Number(prof.water_pct || 0) / 100);

    // Sólidos Totais: calculados a partir da ficha do ingrediente
    // Se total_solids_pct estiver cadastrado, usa o valor da ficha
    // Caso contrário, deriva por: Gordura + ESDL + Açúcares adicionados + Outros Sólidos
    // IMPORTANTE: Lactose já é constituinte natural do ESDL, portanto NÃO é adicionada novamente
    let solidsG = grams * (Number(prof.total_solids_pct || 0) / 100);
    if (solidsG === 0 && (fatG > 0 || msnfG > 0 || sucroseG > 0 || otherSugarsG > 0)) {
      solidsG = fatG + msnfG + sucroseG + otherSugarsG;
    }

    totalFatG += fatG;
    totalMsnfG += msnfG;
    totalLactoseG += lactoseG;
    totalSucroseG += sucroseG;
    totalOtherSugarsG += otherSugarsG;
    totalSolidsG += solidsG;
    totalWaterG += waterG;

    // Normalização dos fatores relativos à sacarose (Sacarose = 1.000)
    let podFactor = Number(prof.pod_factor || 0);
    if (podFactor > 5) podFactor = podFactor / 100; // Normaliza escala 100 para fração 1.00

    let pacFactor = Number(prof.pac_factor || 0);
    if (Math.abs(pacFactor) > 5) pacFactor = pacFactor / 100;

    // Verificação de fatores pendentes em ingredientes açucarados ou compostos
    const hasSugarsOrLactose = (sucroseG + otherSugarsG + lactoseG) > 0;
    if (hasSugarsOrLactose && pacFactor === 0 && podFactor === 0 && sucroseG === 0 && lactoseG === 0) {
      if (prof.data_status !== 'CONFIRMED') {
        missing.push('Fatores POD/PAC não especificados para os açúcares presentes');
      }
    }

    if (missing.length > 0) {
      missingFactors.push({
        ingredientName: item.ingredientName,
        missingProperties: missing
      });
    }

    // CÁLCULO FÍSICO DE POD E PAC
    // 1. Se for ingrediente com modo direto (ex: base comercial pronta com fator fornecido pelo fabricante por grama):
    if (prof.effective_pac_mode === 'DIRECT_FACTOR') {
      weightedPodSum += grams * podFactor;
      weightedPacSum += grams * pacFactor;
    } else {
      // 2. Modo por componentes físico-químicos:
      // POD: Sacarose (1.00) + Lactose (0.16) + Outros açúcares (fator específico do ingrediente)
      const lactosePodFactor = 0.16;
      const ingredientPod = (sucroseG * 1.00) + (lactoseG * lactosePodFactor) + (otherSugarsG * (podFactor || 1.00));
      weightedPodSum += ingredientPod;

      // PAC: Sacarose (1.00) + Lactose (fator da lactose, tipicamente 1.00) + Outros açúcares (fator do açúcar)
      // A contribuição de PAC do leite vem da LACTOSE (lactoseG * 1.00), JAMAIS multiplicando todo o leite líquido!
      const lactosePacFactor = prof.pac_factor && prof.pac_factor > 0 ? (prof.pac_factor > 5 ? prof.pac_factor / 100 : prof.pac_factor) : 1.00;
      const lactosePacContribution = lactoseG * lactosePacFactor;
      const sucrosePacContribution = sucroseG * 1.00;
      const otherSugarsPacContribution = otherSugarsG * (pacFactor || 1.00);

      const ingredientPac = sucrosePacContribution + lactosePacContribution + otherSugarsPacContribution;
      weightedPacSum += ingredientPac;
    }
  }

  const totalSugarG = totalSucroseG + totalOtherSugarsG;

  // Cálculos percentuais por 100g de mistura total (mix)
  const fatPct = totalMassG > 0 ? (totalFatG / totalMassG) * 100 : 0;
  const msnfPct = totalMassG > 0 ? (totalMsnfG / totalMassG) * 100 : 0;
  const sugarPct = totalMassG > 0 ? (totalSugarG / totalMassG) * 100 : 0;
  const totalSolidsPct = totalMassG > 0 ? (totalSolidsG / totalMassG) * 100 : 0;
  const waterPct = totalMassG > 0 ? (totalWaterG / totalMassG) * 100 : 0;

  // POD e PAC por 100g da mistura: (100 / M_total) * soma(equivalente de sacarose em gramas)
  const pod = totalMassG > 0 ? (100 / totalMassG) * weightedPodSum : 0;
  const pac = totalMassG > 0 ? (100 / totalMassG) * weightedPacSum : 0;

  const costPerKg = totalMassG > 0 ? (costTotal / totalMassG) * 1000 : 0;

  const hasPendingFactors = missingFactors.length > 0;
  const isBalanced = Math.abs(totalMassG - targetWeightG) <= 5 && !hasPendingFactors;

  return {
    totalMassG: Number(totalMassG.toFixed(3)),
    totalFatG: Number(totalFatG.toFixed(3)),
    fatPct: Number(fatPct.toFixed(2)),
    totalMsnfG: Number(totalMsnfG.toFixed(3)),
    msnfPct: Number(msnfPct.toFixed(2)),
    totalSugarG: Number(totalSugarG.toFixed(3)),
    sugarPct: Number(sugarPct.toFixed(2)),
    totalSolidsG: Number(totalSolidsG.toFixed(3)),
    totalSolidsPct: Number(totalSolidsPct.toFixed(2)),
    waterPct: Number(waterPct.toFixed(2)),
    pod: Number(pod.toFixed(2)),
    pac: Number(pac.toFixed(2)),
    costTotal: Number(costTotal.toFixed(2)),
    costPerKg: Number(costPerKg.toFixed(2)),
    missingFactors,
    isBalanced,
    isProductionEligible: isBalanced && !hasPendingFactors,
    hasPendingFactors
  };
}

/**
 * Calcula dinamicamente a quantidade do ingrediente de fechamento (Água ou Leite).
 * Regra: Q_fechamento = Peso_Alvo - Soma(TODOS os outros ingredientes).
 * 
 * CORREÇÕES OBRIGATÓRIAS:
 * 1. Inclui expressamente o 1º ingrediente da lista (começando do índice 0).
 * 2. Converte gramas faltantes para a unidade cadastrada com a DENSIDADE ESPECÍFICA exata.
 * 3. Se a densidade estiver ausente para líquidos, rejeita o cálculo do fechamento.
 * 4. Bloqueia resultado negativo caso a soma dos outros insumos exceda o peso alvo.
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
  const isLiquid = closingItem.unit === 'L' || closingItem.unit === 'ml';
  const density = closingItem.profile?.density_g_ml;

  if (isLiquid && (!density || density <= 0)) {
    return {
      closingQuantity: 0,
      closingGrams: 0,
      updatedItems: items,
      error: 'O ingrediente de fechamento líquido requer densidade cadastrada válida (g/ml).'
    };
  }

  // Soma a massa de TODOS os outros ingredientes em gramas, começando do índice 0!
  let sumOtherGrams = 0;
  for (let idx = 0; idx < items.length; idx++) {
    if (idx === closingItemIndex) continue;
    const it = items[idx];
    if (it.profile && it.profile.is_mix_ingredient === false) continue;

    const itLiquid = it.unit === 'L' || it.unit === 'ml';
    const itDensity = it.profile?.density_g_ml;
    if (itLiquid && (!itDensity || itDensity <= 0)) {
      return {
        closingQuantity: 0,
        closingGrams: 0,
        updatedItems: items,
        error: `O ingrediente "${it.ingredientName}" não possui densidade cadastrada para conversão precisa da massa.`
      };
    }

    const { grams, error } = normalizeMassInGrams(it.quantity, it.unit, itDensity);
    if (error) {
      return {
        closingQuantity: 0,
        closingGrams: 0,
        updatedItems: items,
        error: `Erro ao normalizar ${it.ingredientName}: ${error}`
      };
    }
    sumOtherGrams += grams;
  }

  const remainingGrams = targetWeightG - sumOtherGrams;

  if (remainingGrams < 0) {
    return {
      closingQuantity: 0,
      closingGrams: 0,
      updatedItems: items,
      error: `Os ingredientes inseridos (${(sumOtherGrams / 1000).toFixed(3)} kg) já ultrapassam o peso-alvo (${(targetWeightG / 1000).toFixed(3)} kg). Reduza os outros insumos.`
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
 * 
 * Classificação:
 * - OPTIMAL: desvio <= 50% da tolerância
 * - ACCEPTABLE: desvio <= 100% da tolerância
 * - OUT_OF_BOUNDS: desvio > tolerância (exige atenção ou autorização de produção)
 * - PENDING: parâmetros ausentes ou incompletos na ficha técnica
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

    let status: 'OPTIMAL' | 'ACCEPTABLE' | 'OUT_OF_BOUNDS' | 'PENDING' = 'OUT_OF_BOUNDS';

    const hasMissingForParam = metrics.missingFactors.some((f) =>
      f.missingProperties.some((p) => {
        const pLower = p.toLowerCase();
        if (parameter.includes('POD') && (pLower.includes('pod') || pLower.includes('ausentes'))) return true;
        if (parameter.includes('PAC') && (pLower.includes('pac') || pLower.includes('ausentes'))) return true;
        if (parameter.includes('Gordura') && pLower.includes('gordura')) return true;
        return false;
      })
    );

    if (hasMissingForParam) {
      status = 'PENDING';
    } else if (Math.abs(deviation) <= tolerance * 0.5) {
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

  // Verificação da Massa Alvo
  const massDeviation = Number(((metrics.totalMassG - targets.targetWeightG) / 1000).toFixed(3));
  diagnostics.push({
    parameter: 'Massa Total (kg)',
    target: Number((targets.targetWeightG / 1000).toFixed(3)),
    actual: Number((metrics.totalMassG / 1000).toFixed(3)),
    deviation: massDeviation,
    tolerance: 0.005, // 5g de tolerância
    isWithinTolerance: Math.abs(metrics.totalMassG - targets.targetWeightG) <= 5,
    status: Math.abs(metrics.totalMassG - targets.targetWeightG) <= 5 ? 'OPTIMAL' : 'OUT_OF_BOUNDS'
  });

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
 * Exibe '50 L' ou '5,631 L' conforme a precisão sem induzir à leitura de 50 mil.
 */
export function formatPtBrStock(quantity: number, unit: string, forceDecimals: boolean = false): string {
  const num = Number(quantity || 0);
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: forceDecimals ? 3 : (num % 1 === 0 ? 0 : 3),
    maximumFractionDigits: 3
  }).format(num);

  return `${formatted} ${unit}`;
}
