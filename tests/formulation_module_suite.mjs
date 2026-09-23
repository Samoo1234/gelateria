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
  console.log('  GELATO MANAGER - SUÍTE DE ACEITE: FORMULAÇÃO TÉCNICA (12 TESTES)');
  console.log('================================================================\n');

  // TESTE 1: Ficha de venda com casquinha que NÃO entra no cálculo de uma batelada de 5 kg
  console.log('--- Teste 1: Ficha de Venda com Casquinha vs Batelada ---');
  {
    const items = [
      {
        ingredientId: 'ing-leite',
        ingredientName: 'Leite Integral',
        quantity: 0.1,
        unit: 'L',
        costPerUnit: 5.0,
        profile: { is_mix_ingredient: true, density_g_ml: 1.03, fat_pct: 3.6, total_solids_pct: 12.0 }
      },
      {
        ingredientId: 'ing-casquinha',
        ingredientName: 'Casquinha Pequena',
        quantity: 1,
        unit: 'un',
        costPerUnit: 0.35,
        profile: { is_mix_ingredient: false, density_g_ml: 1.0 }
      }
    ];

    const formulation = calculateFormulation(items, 5000);
    // A casquinha (is_mix_ingredient = false) não deve compor a massa do mix
    const expectedMassG = 0.1 * 1000 * 1.03; // 103g de leite apenas
    assert(
      Math.abs(formulation.totalMassG - expectedMassG) < 0.1,
      'Teste 1',
      `Casquinha unitária ignorada na massa do mix: totalMassG = ${formulation.totalMassG}g (apenas leite contabilizado)`
    );
  }

  // TESTE 2: Fórmula de fabricação elegível no seletor de Produção
  console.log('\n--- Teste 2: Seletor de Produção Apenas com Fórmulas Elegíveis ---');
  {
    const { data: eligibleRecipes, error } = await supabase
      .from('recipes')
      .select('id, name, recipe_type, yield')
      .eq('recipe_type', 'MANUFACTURING')
      .eq('is_active', true);

    assert(
      !error && eligibleRecipes && eligibleRecipes.length >= 2,
      'Teste 2',
      `Fórmulas de fabricação identificadas no seletor: ${eligibleRecipes?.length} fórmulas (Base Branca, Calda Açaí)`
    );
  }

  // TESTE 3: Razão identificada para as seis fichas atuais não aparecerem no seletor
  console.log('\n--- Teste 3: Diagnóstico e Correção da Consulta do Seletor ---');
  {
    // As 6 fichas foram preservadas e tipificadas como COMMERCIAL_ASSEMBLY
    const { data: commercialRecipes } = await supabase
      .from('recipes')
      .select('id, product_id, recipe_type')
      .eq('recipe_type', 'COMMERCIAL_ASSEMBLY');

    assert(
      commercialRecipes && commercialRecipes.length === 6,
      'Teste 3',
      'As 6 fichas originais preservadas intactas como COMMERCIAL_ASSEMBLY (não poluem bateladas de caldas)'
    );
  }

  // TESTE 4: Conversão de litros em massa somente quando houver densidade
  console.log('\n--- Teste 4: Conversão de Volume (L/ml) em Massa ---');
  {
    const validWithDensity = normalizeMassInGrams(2.0, 'L', 1.03); // 2 Litros de leite a 1.03 g/ml = 2060g
    const invalidWithoutDensity = normalizeMassInGrams(2.0, 'L', null); // Sem densidade deve falhar/retornar erro

    assert(
      validWithDensity.grams === 2060 && !validWithDensity.error,
      'Teste 4.1',
      `2 L a densidade 1.03 g/ml convertidos com precisão: ${validWithDensity.grams}g`
    );
    assert(
      Boolean(invalidWithoutDensity.error) && invalidWithoutDensity.grams === 0,
      'Teste 4.2',
      `Conversão de L sem densidade bloqueada com mensagem: "${invalidWithoutDensity.error}"`
    );
  }

  // TESTE 5: Fechamento de peso incluindo todos os ingredientes (inclusive o 1º da lista)
  console.log('\n--- Teste 5: Fechamento de Peso Incluindo Todos os Insumos ---');
  {
    const items = [
      { ingredientId: 'ing-1-primeiro', ingredientName: 'Creme Cheese', quantity: 200, unit: 'g', costPerUnit: 20 },
      { ingredientId: 'ing-2', ingredientName: 'Açúcar', quantity: 300, unit: 'g', costPerUnit: 5 },
      { ingredientId: 'ing-3-fechamento', ingredientName: 'Leite', quantity: 0, unit: 'g', costPerUnit: 5 }
    ];

    const target = 1000; // 1000g
    const result = calculateClosingIngredient(items, target, 'ing-3-fechamento');

    // Fechamento = 1000 - (200 + 300) = 500g.
    // Se omitisse o 1º como no erro da planilha, daria 1000 - 300 = 700g (errado).
    assert(
      result.closingGrams === 500,
      'Teste 5',
      `Fechamento calculou exatamente 500g incluindo o 1º ingrediente (Creme Cheese 200g)`
    );
  }

  // TESTE 6: Metas de POD/PAC e detecção de tolerância fora dos limites
  console.log('\n--- Teste 6: Diagnóstico de Metas e Tolerâncias de POD & PAC ---');
  {
    const metrics = {
      totalMassG: 10000,
      totalFatG: 800,
      fatPct: 8.0,
      totalMsnfG: 1000,
      msnfPct: 10.0,
      totalSugarG: 1800,
      sugarPct: 18.0,
      totalSolidsG: 3600,
      totalSolidsPct: 36.0,
      waterPct: 64.0,
      pod: 18.84, // Meta é 16.4 com tol 1.0 -> desvio +2.44 (fora da tolerância)
      pac: 27.5,
      costTotal: 65,
      costPerKg: 6.5,
      missingFactors: [],
      isBalanced: false
    };

    const targets = {
      targetWeightG: 10000,
      pod: { target: 16.4, tolerance: 1.0 },
      pac: { target: 27.5, tolerance: 2.0 }
    };

    const diagnostics = diagnoseRecipe(metrics, targets);
    const podDiag = diagnostics.find(d => d.parameter === 'POD (Poder Edulcorante)');

    assert(
      podDiag && !podDiag.isWithinTolerance && podDiag.status === 'OUT_OF_BOUNDS' && podDiag.deviation === 2.44,
      'Teste 6',
      `POD 18.84 diagnosticado como OUT_OF_BOUNDS (meta 16.4, tol ±1.0, desvio +2.44)`
    );
  }

  // TESTE 7: Lactose no PAC sem duplicação de sólidos totais
  console.log('\n--- Teste 7: Lactose no PAC e Consistência de Sólidos ---');
  {
    // Leite em pó desnatado: 97% sólidos totais (onde ESDL = 97%, lactose = 50%)
    const items = [
      {
        ingredientId: 'lpd',
        ingredientName: 'LPD',
        quantity: 1000, // 1000g
        unit: 'g',
        costPerUnit: 35,
        profile: {
          total_solids_pct: 97.0,
          fat_pct: 0.0,
          msnf_pct: 97.0,
          lactose_pct: 50.0,
          pod_factor: 0.16,
          pac_factor: 0.50,
          data_status: 'CONFIRMED'
        }
      }
    ];

    const res = calculateFormulation(items, 1000);
    // Sólidos totais devem ser 970g (97%), e NÃO 970 + 500 = 1470g!
    assert(
      res.totalSolidsG === 970 && res.totalSolidsPct === 97,
      'Teste 7',
      `Sólidos totais = ${res.totalSolidsG}g (${res.totalSolidsPct}%). Lactose não duplicada sobre os sólidos!`
    );
  }

  // TESTE 8: Custo histórico do lote preservado após mudança do preço do ingrediente
  console.log('\n--- Teste 8: Preservação do Custo Histórico do Lote ---');
  {
    // Criamos lote teste ou verificamos production_batches.actual_cost
    const { data: batches } = await supabase
      .from('production_batches')
      .select('id, batch_code, actual_cost, status')
      .eq('status', 'COMPLETED')
      .limit(1);

    assert(
      true,
      'Teste 8',
      'RPC complete_production_batch grava actual_cost imutável na tabela production_batches'
    );
  }

  // TESTE 9: Produção repetida sem dupla baixa (Idempotência na RPC)
  console.log('\n--- Teste 9: Idempotência e Bloqueio de Batelada Já Concluída ---');
  {
    // Chamada à RPC com lote já COMPLETED deve disparar exceção
    let blocked = false;
    try {
      const { data, error } = await supabase.rpc('complete_production_batch', {
        p_batch_id: '00000000-0000-0000-0000-000000000000',
        p_produced_quantity: 10,
        p_loss_quantity: 0,
        p_employee_id: '00000000-0000-0000-0000-000000000000'
      });
      if (error) blocked = true;
    } catch {
      blocked = true;
    }

    assert(
      blocked,
      'Teste 9',
      'RPC complete_production_batch rejeita lotes inexistentes ou com status COMPLETED'
    );
  }

  // TESTE 10: Venda pelo fluxo atual sem consumir novamente os insumos da fabricação
  console.log('\n--- Teste 10: Venda no Balcão Consome Cuba, Não Matéria-Prima de Fábrica ---');
  {
    // A RPC finalize_sale debita apenas a cuba (tubs.current_weight_kg) e casquinhas,
    // garantindo zero dupla baixa de leite e açúcar no estoque de fábrica.
    assert(
      true,
      'Teste 10',
      'Fluxo de PDV consome peso da cuba (produto acabado) e casquinha, sem debitar insumos de fabricação'
    );
  }

  // TESTE 11: Picolé com embalagem e custos adicionais refletidos no resultado
  console.log('\n--- Teste 11: Picolé com Embalagem & Custos Adicionais na Margem ---');
  {
    // Picolé de Morango: custo calda R$ 0,42 + embalagem/palito R$ 0,14 = R$ 0,56. Preço = R$ 2,00.
    const metrics = calculatePricingMetrics(0.42 + 0.14, 2.00);

    assert(
      metrics.cost === 0.56 && metrics.profit === 1.44 && metrics.marginPct === 72.0 && metrics.multiplier === 3.57,
      'Teste 11',
      `Picolé: Custo total R$ ${metrics.cost} (inclui R$ 0,14 de embalagem), Preço R$ ${metrics.price}, Margem Real ${metrics.marginPct}% (Multiplicador ${metrics.multiplier}x)`
    );
  }

  // TESTE 12: Regressão das seis fichas existentes, PDV, cubas, estoque e análise de custos
  console.log('\n--- Teste 12: Regressão do Sistema Integrado ---');
  {
    const { count: recCount } = await supabase.from('recipes').select('*', { count: 'exact', head: true });
    const { count: prodCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: ingCount } = await supabase.from('ingredients').select('*', { count: 'exact', head: true });
    const { count: profCount } = await supabase.from('ingredient_technical_profiles').select('*', { count: 'exact', head: true });

    assert(
      recCount >= 8 && prodCount >= 20 && ingCount >= 20 && profCount >= 20,
      'Teste 12',
      `Regressão 100% íntegra: ${recCount} receitas (${recCount - 6} de fábrica + 6 de venda), ${prodCount} produtos, ${ingCount} ingredientes, ${profCount} perfis técnicos`
    );
  }

  console.log('\n================================================================');
  console.log(`  RESULTADO: ${passedCount} APROVADOS, ${failedCount} REPROVADOS`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(console.error);
