import { createClient } from '@supabase/supabase-js';
import { 
  calculateFormulation, 
  extractTechnicalProfile, 
  diagnoseRecipe,
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

async function run() {
  console.log('========================================================================');
  console.log('  GELATO MANAGER V2 - VERIFICAÇÃO DE CALIBRAÇÃO E HISTÓRICO NO BANCO REAL');
  console.log('========================================================================\n');

  // Busca todas as fórmulas de fabricação (ativas e arquivadas)
  const { data: recipes, error: recErr } = await supabase
    .from('recipes')
    .select(`
      id,
      name,
      recipe_type,
      yield,
      version,
      status,
      is_active,
      target_weight_g,
      target_fat_pct,
      fat_tolerance_pct,
      recipe_items(
        id,
        quantity,
        unit,
        is_closing_ingredient,
        ingredients(
          id,
          name,
          cost_per_unit,
          current_stock,
          ingredient_technical_profiles(*)
        )
      )
    `)
    .eq('recipe_type', 'MANUFACTURING');

  if (recErr || !recipes) {
    console.error('Falha ao buscar receitas:', recErr);
    process.exit(1);
  }

  const baseBrancaV2 = recipes.find(r => r.name.toLowerCase().includes('base branca') && r.is_active === true);
  const baseBrancaV1 = recipes.find(r => r.name.toLowerCase().includes('base branca') && r.is_active === false);
  const baseAcai = recipes.find(r => (r.name.toLowerCase().includes('açaí') || r.name.toLowerCase().includes('acai')) && r.is_active === true);

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 1: Calibração da Base Branca v2.0 (10,000 kg cravados e zero desvio)
  // --------------------------------------------------------------------------------------------------
  console.log('--- Verificação 1: Base Branca v2.0 Vigente Calibrada (10,000 kg) ---');
  {
    let leiteMassKg = 0;
    let cremeMassKg = 0;
    let secosMassKg = 0;

    const items = baseBrancaV2.recipe_items.map((it) => {
      const prof = extractTechnicalProfile(it.ingredients?.ingredient_technical_profiles);
      const density = prof?.density_g_ml;
      let massG = 0;
      if (it.unit === 'kg') massG = it.quantity * 1000;
      else if (it.unit === 'g') massG = it.quantity;
      else if (it.unit === 'L') massG = it.quantity * 1000 * (density || 0);
      else if (it.unit === 'ml') massG = it.quantity * (density || 0);

      const nameLower = it.ingredients.name.toLowerCase();
      if (nameLower.includes('leite integral')) {
        leiteMassKg += massG / 1000;
      } else if (nameLower.includes('creme de leite')) {
        cremeMassKg += massG / 1000;
      } else {
        secosMassKg += massG / 1000;
      }

      return {
        ingredientId: it.ingredients.id,
        ingredientName: it.ingredients.name,
        quantity: Number(it.quantity),
        unit: it.unit,
        costPerUnit: Number(it.ingredients.cost_per_unit || 0),
        isClosingIngredient: it.is_closing_ingredient,
        profile: prof
      };
    });

    const metrics = calculateFormulation(items, Number(baseBrancaV2.target_weight_g || 10000));
    const totalMassKg = metrics.totalMassG / 1000;

    const leiteOk = Math.abs(leiteMassKg - 5.150) < 0.005;
    const cremeOk = Math.abs(cremeMassKg - 2.450) < 0.005;
    const secosOk = Math.abs(secosMassKg - 2.400) < 0.005;
    const totalOk = Math.abs(totalMassKg - 10.000) < 0.005;

    assert(
      leiteOk && cremeOk && secosOk && totalOk,
      'Verificação 1 (Base Branca v2.0)',
      `Leite: ${leiteMassKg.toFixed(3)} kg, Creme: ${cremeMassKg.toFixed(3)} kg, Secos: ${secosMassKg.toFixed(3)} kg => Total: ${totalMassKg.toFixed(3)} kg (Desvio: ${(totalMassKg - 10.000).toFixed(3)} kg, Versão: ${baseBrancaV2.version})`
    );
  }

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 2: Gordura da Base Branca v2.0 em 8,02% (Meta 8,00%, Status OPTIMAL)
  // --------------------------------------------------------------------------------------------------
  console.log('\n--- Verificação 2: Gordura da Base Branca v2.0 em 8,02% (Dentro da Meta 8%) ---');
  {
    const items = baseBrancaV2.recipe_items.map((it) => ({
      ingredientId: it.ingredients.id,
      ingredientName: it.ingredients.name,
      quantity: Number(it.quantity),
      unit: it.unit,
      costPerUnit: Number(it.ingredients.cost_per_unit || 0),
      isClosingIngredient: it.is_closing_ingredient,
      profile: extractTechnicalProfile(it.ingredients?.ingredient_technical_profiles)
    }));

    const metrics = calculateFormulation(items, 10000);
    const diags = diagnoseRecipe(metrics, {
      targetWeightG: 10000,
      fatPct: { target: 8.0, tolerance: 1.0 },
      msnfPct: { target: 10.5, tolerance: 1.0 },
      sugarPct: { target: 18.0, tolerance: 1.5 },
      totalSolidsPct: { target: 36.5, tolerance: 2.0 },
      pod: { target: 16.4, tolerance: 1.5 },
      pac: { target: 27.5, tolerance: 2.0 }
    });

    const fatDiag = diags.find(d => d.parameter === 'Gordura (%)');
    const allOptimal = diags.every(d => d.status === 'OPTIMAL');

    assert(
      Math.abs(metrics.fatPct - 8.02) < 0.05 && fatDiag?.status === 'OPTIMAL' && allOptimal,
      'Verificação 2 (Gordura v2.0)',
      `Gordura calculada: ${metrics.fatPct}% (Meta: 8.00% ± 1.00%, Status: ${fatDiag?.status}). 100% dos parâmetros em status OPTIMAL!`
    );
  }

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 3: Rastreabilidade e Histórico da Versão 1.0 Arquivada
  // --------------------------------------------------------------------------------------------------
  console.log('\n--- Verificação 3: Preservação Histórica da Versão 1.0 no Banco ---');
  {
    const isArchived = baseBrancaV1 && baseBrancaV1.status === 'ARCHIVED' && baseBrancaV1.is_active === false;

    const v1Items = baseBrancaV1.recipe_items.map((it) => ({
      ingredientId: it.ingredients.id,
      ingredientName: it.ingredients.name,
      quantity: Number(it.quantity),
      unit: it.unit,
      costPerUnit: Number(it.ingredients.cost_per_unit || 0),
      isClosingIngredient: it.is_closing_ingredient,
      profile: extractTechnicalProfile(it.ingredients?.ingredient_technical_profiles)
    }));

    const v1Metrics = calculateFormulation(v1Items, 10000);

    const v1MassOk = Math.abs(v1Metrics.totalMassG - 10174) < 5;
    const v1FatOk = Math.abs(v1Metrics.fatPct - 5.12) < 0.05;

    assert(
      isArchived && v1MassOk && v1FatOk,
      'Verificação 3 (Histórico v1.0 Preservado)',
      `v1.0 arquivada intacta: status=${baseBrancaV1?.status}, is_active=${baseBrancaV1?.is_active}, massa=${(v1Metrics.totalMassG/1000).toFixed(3)} kg, gordura=${v1Metrics.fatPct}%`
    );
  }

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 4: Prévia de Ordem de 10 kg da Base Branca v2.0 (Escala 1,000x exata)
  // --------------------------------------------------------------------------------------------------
  console.log('\n--- Verificação 4: Escala na Ordem de Produção de 10 kg da v2.0 ---');
  {
    const bbItems = baseBrancaV2.recipe_items.map((it) => ({
      ingredientId: it.ingredients.id,
      ingredientName: it.ingredients.name,
      quantity: Number(it.quantity),
      unit: it.unit,
      costPerUnit: Number(it.ingredients.cost_per_unit || 0),
      isClosingIngredient: it.is_closing_ingredient,
      profile: extractTechnicalProfile(it.ingredients?.ingredient_technical_profiles)
    }));
    const bbMetrics = calculateFormulation(bbItems, 10000);
    const bbRealMassKg = bbMetrics.totalMassG / 1000;
    const bbPlannedKg = 10.0;
    const bbScaleRatio = bbPlannedKg / bbRealMassKg;

    assert(
      Math.abs(bbScaleRatio - 1.000) < 0.001,
      'Verificação 4 (Escala 10kg)',
      `Base Branca v2.0 (10kg): escala = ${bbScaleRatio.toFixed(3)}x (massa real ${bbRealMassKg.toFixed(3)} kg). Zero divergência.`
    );
  }

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 5: Parcelas de massa da Calda Base Açaí (10,000 kg com 3,980 kg de água)
  // --------------------------------------------------------------------------------------------------
  console.log('\n--- Verificação 5: Parcelas de massa da Calda Base Açaí nos dados persistidos ---');
  {
    let aguaMassKg = 0;
    let demaisMassKg = 0;

    const items = baseAcai.recipe_items.map((it) => {
      const prof = extractTechnicalProfile(it.ingredients?.ingredient_technical_profiles);
      const density = prof?.density_g_ml;
      let massG = 0;
      if (it.unit === 'kg') massG = it.quantity * 1000;
      else if (it.unit === 'g') massG = it.quantity;
      else if (it.unit === 'L') massG = it.quantity * 1000 * (density || 0);
      else if (it.unit === 'ml') massG = it.quantity * (density || 0);

      const nameLower = it.ingredients.name.toLowerCase();
      if (nameLower.includes('água') || nameLower.includes('agua')) {
        aguaMassKg += massG / 1000;
      } else {
        demaisMassKg += massG / 1000;
      }

      return {
        ingredientId: it.ingredients.id,
        ingredientName: it.ingredients.name,
        quantity: Number(it.quantity),
        unit: it.unit,
        costPerUnit: Number(it.ingredients.cost_per_unit || 0),
        isClosingIngredient: it.is_closing_ingredient,
        profile: prof
      };
    });

    const metrics = calculateFormulation(items, Number(baseAcai.target_weight_g || 10000));
    const totalMassKg = metrics.totalMassG / 1000;

    const aguaOk = Math.abs(aguaMassKg - 3.980) < 0.005;
    const demaisOk = Math.abs(demaisMassKg - 6.020) < 0.005;
    const totalOk = Math.abs(totalMassKg - 10.000) < 0.005;

    assert(
      aguaOk && demaisOk && totalOk,
      'Verificação 5 (Açaí)',
      `Água: ${aguaMassKg.toFixed(3)} kg, Demais: ${demaisMassKg.toFixed(3)} kg => Total: ${totalMassKg.toFixed(3)} kg`
    );
  }

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 6: Preservação de Fichas Comerciais (COMMERCIAL_ASSEMBLY), PDV e Estoque
  // --------------------------------------------------------------------------------------------------
  console.log('\n--- Verificação 6: Preservação de Fichas Comerciais, PDV e Estoque ---');
  {
    const { data: commRecipes } = await supabase
      .from('recipes')
      .select('id, name, recipe_type, product_id, yield, recipe_items(*, ingredients(name, unit))')
      .eq('recipe_type', 'COMMERCIAL_ASSEMBLY')
      .eq('is_active', true);

    const { data: activeProducts } = await supabase
      .from('products')
      .select('id, name, price, is_active')
      .eq('is_active', true);

    const { data: stockItems } = await supabase
      .from('ingredients')
      .select('id, name, current_stock, unit')
      .eq('is_active', true);

    const commCountOk = (commRecipes?.length || 0) === 6;
    const productsOk = (activeProducts?.length || 0) > 0;
    const stockOk = (stockItems?.length || 0) > 0;

    assert(
      commCountOk && productsOk && stockOk,
      'Verificação 6 (Preservação de Módulos)',
      `${commRecipes?.length} fichas comerciais ativas preservadas, ${activeProducts?.length} produtos de venda no PDV ativos, ${stockItems?.length} insumos de estoque ativos.`
    );
  }

  console.log('\n========================================================================');
  console.log(`  RESULTADO FINAL: ${passedCount} APROVADOS, ${failedCount} REPROVADOS`);
  console.log('========================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

run();
