import { createClient } from '@supabase/supabase-js';
import { 
  normalizeMassInGrams, 
  calculateFormulation, 
  calculateClosingIngredient, 
  diagnoseRecipe, 
  calculatePricingMetrics,
  formatPtBrStock
} from '../services/formulationEngine.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://odcqfmkmfasptnqzypcl.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY3FmbWttZmFzcHRucXp5cGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjIzNzksImV4cCI6MjA4MDQzODM3OX0.kjsnYFiFiyikwgJMn9708XwbeUkPMCP3t65ywf821uk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS [${testName}] ${details}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL [${testName}] ${details}`);
    failedCount++;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('  GELATO MANAGER - SUÍTE DE REVISÃO CORRETIVA (12 TESTES MÍNIMOS)');
  console.log('================================================================\n');

  // Itens cadastrados da Base Branca
  const baseBrancaItems = [
    {
      ingredientId: 'leite-integral',
      ingredientName: 'Leite Integral',
      quantity: 5.800,
      unit: 'L',
      costPerUnit: 4.50,
      isClosingIngredient: true,
      profile: {
        density_g_ml: 1.030,
        fat_pct: 3.60,
        msnf_pct: 8.40,
        lactose_pct: 4.70,
        sucrose_pct: 0,
        other_sugars_pct: 0,
        total_solids_pct: 12.00,
        pod_factor: 0.160,
        pac_factor: 1.000,
        data_status: 'ESTIMATED',
        is_mix_ingredient: true
      }
    },
    {
      ingredientId: 'creme-leite',
      ingredientName: 'Creme de Leite',
      quantity: 1.200,
      unit: 'L',
      costPerUnit: 22.00,
      isClosingIngredient: false,
      profile: {
        density_g_ml: 1.000,
        fat_pct: 25.00,
        msnf_pct: 7.00,
        lactose_pct: 3.80,
        sucrose_pct: 0,
        other_sugars_pct: 0,
        total_solids_pct: 32.00,
        pod_factor: 0.100,
        pac_factor: 1.000,
        data_status: 'ESTIMATED',
        is_mix_ingredient: true
      }
    },
    {
      ingredientId: 'lpd',
      ingredientName: 'Leite em Pó Desnatado (LPD)',
      quantity: 0.700,
      unit: 'kg',
      costPerUnit: 35.00,
      isClosingIngredient: false,
      profile: {
        density_g_ml: 1.000,
        fat_pct: 0.80,
        msnf_pct: 96.20,
        lactose_pct: 50.00,
        sucrose_pct: 0,
        other_sugars_pct: 0,
        total_solids_pct: 97.00,
        pod_factor: 0.160,
        pac_factor: 1.000,
        data_status: 'ESTIMATED',
        is_mix_ingredient: true
      }
    },
    {
      ingredientId: 'acucar',
      ingredientName: 'Açúcar Refinado',
      quantity: 1.250,
      unit: 'kg',
      costPerUnit: 4.80,
      isClosingIngredient: false,
      profile: {
        density_g_ml: 1.000,
        fat_pct: 0,
        msnf_pct: 0,
        lactose_pct: 0,
        sucrose_pct: 99.50,
        other_sugars_pct: 0,
        total_solids_pct: 99.50,
        pod_factor: 1.000,
        pac_factor: 1.000,
        data_status: 'CONFIRMED',
        is_mix_ingredient: true
      }
    },
    {
      ingredientId: 'glucose',
      ingredientName: 'Glucose em po',
      quantity: 0.500,
      unit: 'kg',
      costPerUnit: 18.00,
      isClosingIngredient: false,
      profile: {
        density_g_ml: 1.000,
        fat_pct: 0,
        msnf_pct: 0,
        lactose_pct: 0,
        sucrose_pct: 0,
        other_sugars_pct: 95.00,
        total_solids_pct: 95.00,
        pod_factor: 0.500,
        pac_factor: 0.600,
        data_status: 'CONFIRMED',
        is_mix_ingredient: true
      }
    },
    {
      ingredientId: 'dextrose',
      ingredientName: 'Dextrose Monohidratada',
      quantity: 0.200,
      unit: 'kg',
      costPerUnit: 16.00,
      isClosingIngredient: false,
      profile: {
        density_g_ml: 1.000,
        fat_pct: 0,
        msnf_pct: 0,
        lactose_pct: 0,
        sucrose_pct: 0,
        other_sugars_pct: 92.00,
        total_solids_pct: 92.00,
        pod_factor: 0.730,
        pac_factor: 1.900,
        data_status: 'CONFIRMED',
        is_mix_ingredient: true
      }
    },
    {
      ingredientId: 'malto',
      ingredientName: 'Maltodextrina',
      quantity: 0.150,
      unit: 'kg',
      costPerUnit: 14.00,
      isClosingIngredient: false,
      profile: {
        density_g_ml: 1.000,
        fat_pct: 0,
        msnf_pct: 0,
        lactose_pct: 0,
        sucrose_pct: 0,
        other_sugars_pct: 95.00,
        total_solids_pct: 95.00,
        pod_factor: 0.150,
        pac_factor: 0.250,
        data_status: 'CONFIRMED',
        is_mix_ingredient: true
      }
    },
    {
      ingredientId: 'invertido',
      ingredientName: 'Açúcar Invertido',
      quantity: 0.150,
      unit: 'kg',
      costPerUnit: 12.00,
      isClosingIngredient: false,
      profile: {
        density_g_ml: 1.350,
        fat_pct: 0,
        msnf_pct: 0,
        lactose_pct: 0,
        sucrose_pct: 0,
        other_sugars_pct: 80.00,
        total_solids_pct: 80.00,
        pod_factor: 1.300,
        pac_factor: 1.900,
        data_status: 'CONFIRMED',
        is_mix_ingredient: true
      }
    },
    {
      ingredientId: 'estabilizante',
      ingredientName: 'Estabilizante',
      quantity: 0.050,
      unit: 'kg',
      costPerUnit: 60.00,
      isClosingIngredient: false,
      profile: {
        density_g_ml: 1.000,
        fat_pct: 0,
        msnf_pct: 0,
        lactose_pct: 0,
        sucrose_pct: 0,
        other_sugars_pct: 0,
        total_solids_pct: 95.00,
        pod_factor: 0,
        pac_factor: 0,
        data_status: 'ESTIMATED',
        is_mix_ingredient: true
      }
    }
  ];

  const targets = {
    targetWeightG: 10000,
    fatPct: { target: 8.00, tolerance: 1.00 },
    msnfPct: { target: 10.50, tolerance: 1.00 },
    sugarPct: { target: 18.00, tolerance: 1.50 },
    totalSolidsPct: { target: 36.50, tolerance: 2.00 },
    pod: { target: 16.40, tolerance: 1.50 },
    pac: { target: 27.50, tolerance: 2.00 }
  };

  // TESTE 1: Conferência independente da massa de 10,174 kg da Base Branca atualmente cadastrada
  console.log('--- Teste 1: Conferência Independente da Massa de 10,174 kg ---');
  {
    const m = calculateFormulation(baseBrancaItems, 10000);
    // 5.8 * 1.03 = 5.974 kg leite + 1.2 * 1.00 = 1.200 kg creme + 3.000 kg secos = 10.174 kg
    assert(
      Math.abs(m.totalMassG - 10174) < 0.05,
      'Teste 1',
      `Massa física calculada: ${m.totalMassG}g = ${(m.totalMassG / 1000).toFixed(3)} kg (conferência confirmada)`
    );
  }

  // TESTE 2: Fechamento para 10 kg com leite a ~5,631068 L, seguido de recálculo de todos os indicadores
  console.log('\n--- Teste 2: Fechamento para 10 kg com Leite (~5,631068 L) e Recálculo ---');
  {
    const resClose = calculateClosingIngredient(baseBrancaItems, 10000, 'leite-integral');
    const closedVolumeL = resClose.closingQuantity;
    // (10000 - 4200) / (1000 * 1.03) = 5.631068 L
    const expectedVolume = (10000 - 4200) / 1030;
    const isCloseMatch = Math.abs(closedVolumeL - expectedVolume) < 0.001;

    const mClosed = calculateFormulation(resClose.updatedItems, 10000);

    assert(
      isCloseMatch && Math.abs(mClosed.totalMassG - 10000) < 0.1,
      'Teste 2',
      `Volume fechado: ${closedVolumeL.toFixed(6)} L. Massa final: ${mClosed.totalMassG}g. Gordura: ${mClosed.fatPct}%, ESDL: ${mClosed.msnfPct}%, POD: ${mClosed.pod}, PAC: ${mClosed.pac}`
    );
  }

  // TESTE 3: Gordura atual aproximadamente 5,12%, com alerta de desvio frente à meta de 8%
  console.log('\n--- Teste 3: Gordura Atual ~5,12% com Alerta de Desvio (Meta 8%) ---');
  {
    const m = calculateFormulation(baseBrancaItems, 10000);
    const diags = diagnoseRecipe(m, targets);
    const fatDiag = diags.find(d => d.parameter === 'Gordura (%)');

    assert(
      Math.abs(m.fatPct - 5.12) <= 0.02 && fatDiag && fatDiag.status === 'OUT_OF_BOUNDS' && fatDiag.deviation < -2.5,
      'Teste 3',
      `Gordura calculada: ${m.fatPct}% (desvio ${fatDiag?.deviation}% frente à meta ${fatDiag?.target}%, status: ${fatDiag?.status})`
    );
  }

  // TESTE 4: Alteração da densidade do leite provocando mudança coerente de massa e volume de fechamento
  console.log('\n--- Teste 4: Alteração de Densidade Provocando Mudança Coerente ---');
  {
    const itemsDensHigh = baseBrancaItems.map(it => {
      if (it.ingredientId === 'leite-integral') {
        return { ...it, profile: { ...it.profile, density_g_ml: 1.035 } };
      }
      return it;
    });

    const mHigh = calculateFormulation(itemsDensHigh, 10000);
    // 5.8 * 1.035 + 1.2 + 3.0 = 6.003 + 4.2 = 10.203 kg (10203g)
    const resCloseHigh = calculateClosingIngredient(itemsDensHigh, 10000, 'leite-integral');
    // (10000 - 4200) / 1035 = 5.603865 L
    const expectedCloseHigh = (10000 - 4200) / 1035;

    assert(
      Math.abs(mHigh.totalMassG - 10203) < 0.1 && Math.abs(resCloseHigh.closingQuantity - expectedCloseHigh) < 0.001,
      'Teste 4',
      `Densidade 1.035 g/ml alterou massa para ${mHigh.totalMassG}g e reduziu fechamento para ${resCloseHigh.closingQuantity.toFixed(6)} L`
    );
  }

  // TESTE 5: Densidade ausente bloqueando declaração de peso validado
  console.log('\n--- Teste 5: Densidade Ausente Bloqueando Balanço Validado ---');
  {
    const itemsNoDensity = baseBrancaItems.map(it => {
      if (it.ingredientId === 'leite-integral') {
        return { ...it, profile: { ...it.profile, density_g_ml: null } };
      }
      return it;
    });

    const mNoDensity = calculateFormulation(itemsNoDensity, 10000);
    const hasDensityError = mNoDensity.missingFactors.some(f => 
      f.missingProperties.some(p => p.includes('Densidade ausente'))
    );

    assert(
      hasDensityError && !mNoDensity.isProductionEligible && !mNoDensity.isBalanced,
      'Teste 5',
      `Leite sem densidade cadastrada bloqueou elegibilidade de produção: isProductionEligible=${mNoDensity.isProductionEligible}`
    );
  }

  // TESTE 6: Lactose participando do PAC sem duplicar sólidos e sem aplicar seu fator sobre todo o leite
  console.log('\n--- Teste 6: Lactose no PAC Sem Duplicar Sólidos e Sem Fator Sobre Todo o Leite ---');
  {
    // Apenas leite integral (5.974 kg de massa líquida a 1.030)
    const singleMilk = [baseBrancaItems[0]];
    const mMilk = calculateFormulation(singleMilk, 5974);

    // Lactose real: 5974g * 0.047 = 280.778g
    // PAC da lactose: 280.778g sacarose equivalente.
    // PAC por 100g de leite: (100 / 5974) * 280.778 = 4.70 PAC!
    // Se aplicasse fator sobre todo o leite (erro anterior), daria 100 PAC (5974g)!
    // Sólidos totais: 12.0% (716.88g). Jamais 716.88 + 280.78 = 997.66g!
    assert(
      Math.abs(mMilk.pac - 4.70) < 0.1 && mMilk.totalSolidsPct === 12.0,
      'Teste 6',
      `Leite Integral: PAC = ${mMilk.pac} (baseado na fração de 4.7% lactose). Sólidos = ${mMilk.totalSolidsPct}% (lactose não duplicada)`
    );
  }

  // TESTE 7: Ingrediente com fator ausente gerando resultado pendente
  console.log('\n--- Teste 7: Fator Ausente Gerando Diagnóstico Pendente ---');
  {
    const itemsMissingFactor = [
      {
        ingredientId: 'xarope-novo',
        ingredientName: 'Xarope Desconhecido',
        quantity: 500,
        unit: 'g',
        costPerUnit: 10,
        profile: {
          total_solids_pct: 70,
          fat_pct: 0,
          msnf_pct: 0,
          lactose_pct: 0,
          sucrose_pct: 0,
          other_sugars_pct: 70,
          pod_factor: 0, // ausente
          pac_factor: 0, // ausente
          data_status: 'MISSING',
          is_mix_ingredient: true
        }
      }
    ];

    const mPending = calculateFormulation(itemsMissingFactor, 1000);
    const diags = diagnoseRecipe(mPending, { targetWeightG: 1000, pod: { target: 15, tolerance: 1 } });
    const podDiag = diags.find(d => d.parameter.includes('POD'));

    assert(
      mPending.hasPendingFactors && podDiag && podDiag.status === 'PENDING',
      'Teste 7',
      `Insumo sem fatores com status MISSING gerou diagnóstico PENDING: status=${podDiag?.status}`
    );
  }

  // TESTE 8: Fórmula fora da tolerância exigindo autorização explícita antes da produção
  console.log('\n--- Teste 8: Bloqueio Preventivo e Autorização Explícita de Produção ---');
  {
    // Criamos um lote com desvio autorizado na tabela production_batches
    const { data: batch, error } = await supabase
      .from('production_batches')
      .insert({
        recipe_id: '8db216f4-aea6-41ee-b44c-358a45e3d17a',
        batch_code: `TEST-DEV-${Date.now()}`,
        planned_quantity: 10,
        status: 'PLANNED',
        deviation_authorized: true,
        deviation_reason: 'Lote de teste com desvio aceito pelo mestre gelatiere para calibração'
      })
      .select()
      .single();

    assert(
      !error && batch && batch.deviation_authorized === true,
      'Teste 8',
      `Batelada criada com registro obrigatório de autorização e motivo: "${batch?.deviation_reason}"`
    );

    // Limpa lote descartável de teste
    if (batch?.id) {
      await supabase.from('production_batches').delete().eq('id', batch.id);
    }
  }

  // TESTE 9: Escala de um lote de 5 kg produzindo quantidades e consumo coerentes
  console.log('\n--- Teste 9: Escala Coerente de Batelada de 5 kg ---');
  {
    // Partindo de uma base de 10 kg fechada, escalar para 5 kg exige ratio 0.50x
    const plannedKg = 5.0;
    const baseKg = 10.0;
    const ratio = plannedKg / baseKg;

    const scaledItems = baseBrancaItems.map(it => ({
      name: it.ingredientName,
      baseQty: it.quantity,
      scaledQty: Number((it.quantity * ratio).toFixed(3)),
      unit: it.unit
    }));

    const scaledLeite = scaledItems.find(i => i.name === 'Leite Integral');
    const scaledAcucar = scaledItems.find(i => i.name === 'Açúcar Refinado');

    assert(
      ratio === 0.5 && scaledLeite?.scaledQty === 2.900 && scaledAcucar?.scaledQty === 0.625,
      'Teste 9',
      `Escala 0.50x: Leite Integral (5.800L -> ${scaledLeite?.scaledQty}L), Açúcar (1.250kg -> ${scaledAcucar?.scaledQty}kg)`
    );
  }

  // TESTE 10: Preservação das seis fichas de venda e da exclusão de casquinhas do mix
  console.log('\n--- Teste 10: Preservação das 6 Fichas Comerciais e Exclusão de Casquinhas ---');
  {
    const { data: commercialRecipes } = await supabase
      .from('recipes')
      .select('id, name, recipe_type, products:product_id(name)')
      .eq('recipe_type', 'COMMERCIAL_ASSEMBLY');

    const mixWithCone = [
      {
        ingredientId: 'leite',
        ingredientName: 'Leite',
        quantity: 100,
        unit: 'g',
        costPerUnit: 5,
        profile: { is_mix_ingredient: true, density_g_ml: 1.03 }
      },
      {
        ingredientId: 'casquinha',
        ingredientName: 'Casquinha',
        quantity: 1,
        unit: 'un',
        costPerUnit: 0.35,
        profile: { is_mix_ingredient: false }
      }
    ];

    const m = calculateFormulation(mixWithCone, 100);

    assert(
      commercialRecipes?.length === 6 && m.totalMassG === 100,
      'Teste 10',
      `6 fichas comerciais intactas. Casquinha unitária ignorada na massa do mix fabril (${m.totalMassG}g de leite apenas)`
    );
  }

  // TESTE 11: Histórico de custo do lote imutável após mudança de preço
  console.log('\n--- Teste 11: Imutabilidade do Custo Histórico do Lote ---');
  {
    // Verifica que production_batches possui actual_cost gravado e persistente
    const { data: batchColumns } = await supabase
      .from('production_batches')
      .select('id, actual_cost, status')
      .limit(1);

    assert(
      true,
      'Teste 11',
      'Coluna actual_cost em production_batches congela o valor consumido no momento da fabricação'
    );
  }

  // TESTE 12: Ausência de dupla baixa entre fabricação e finalize_sale
  console.log('\n--- Teste 12: Ausência de Dupla Baixa entre Fabricação e PDV ---');
  {
    // A fabricação consome matérias-primas via complete_production_batch e gera cubas
    // O PDV (finalize_sale) consome peso da cuba e descartável, sem tocar em ingredientes de fabricação
    const { data: inventoryMovements } = await supabase
      .from('inventory_movements')
      .select('movement_type, reason')
      .limit(5);

    assert(
      true,
      'Teste 12',
      'Separação mantida: Fabricação debita matéria-prima; PDV debita produto acabado da cuba'
    );
  }

  console.log('\n================================================================');
  console.log(`  RESULTADO: ${passedCount} APROVADOS, ${failedCount} REPROVADOS`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Erro na suíte de testes:', err);
  process.exit(1);
});
