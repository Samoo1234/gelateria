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
  console.log('  GELATO MANAGER V2 - VERIFICAÇÃO OBRIGATÓRIA COM DADOS DO BANCO REAL');
  console.log('========================================================================\n');

  // Busca fórmulas de fabricação reais
  const { data: recipes, error: recErr } = await supabase
    .from('recipes')
    .select(`
      id,
      name,
      recipe_type,
      yield,
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
    .eq('recipe_type', 'MANUFACTURING')
    .eq('is_active', true);

  if (recErr || !recipes) {
    console.error('Falha ao buscar receitas:', recErr);
    process.exit(1);
  }

  const baseBranca = recipes.find(r => r.name.toLowerCase().includes('base branca'));
  const baseAcai = recipes.find(r => r.name.toLowerCase().includes('açaí') || r.name.toLowerCase().includes('acai'));

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 1: Parcelas de massa da Base Branca (5,974 kg leite + 1,200 kg creme + 3,000 kg secos = 10,174 kg)
  // --------------------------------------------------------------------------------------------------
  console.log('--- Verificação 1: Parcelas de massa da Base Branca nos dados persistidos ---');
  {
    let leiteMassKg = 0;
    let cremeMassKg = 0;
    let secosMassKg = 0;

    const items = baseBranca.recipe_items.map((it) => {
      const prof = extractTechnicalProfile(it.ingredients?.ingredient_technical_profiles);
      const isLiquid = it.unit === 'L' || it.unit === 'ml';
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

    const metrics = calculateFormulation(items, Number(baseBranca.target_weight_g || 10000));
    const totalMassKg = metrics.totalMassG / 1000;

    const leiteOk = Math.abs(leiteMassKg - 5.974) < 0.005;
    const cremeOk = Math.abs(cremeMassKg - 1.200) < 0.005;
    const secosOk = Math.abs(secosMassKg - 3.000) < 0.005;
    const totalOk = Math.abs(totalMassKg - 10.174) < 0.005;

    assert(
      leiteOk && cremeOk && secosOk && totalOk,
      'Verificação 1 (Base Branca)',
      `Leite: ${leiteMassKg.toFixed(3)} kg, Creme: ${cremeMassKg.toFixed(3)} kg, Secos: ${secosMassKg.toFixed(3)} kg => Total: ${totalMassKg.toFixed(3)} kg (Desvio: +${(totalMassKg - 10.000).toFixed(3)} kg)`
    );
  }

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 2: Parcelas de massa do Açaí (3,980 kg água + 6,020 kg secos/polpa = 10,000 kg)
  // --------------------------------------------------------------------------------------------------
  console.log('\n--- Verificação 2: Parcelas de massa da Calda Base Açaí nos dados persistidos ---');
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
      'Verificação 2 (Açaí)',
      `Água: ${aguaMassKg.toFixed(3)} kg, Demais: ${demaisMassKg.toFixed(3)} kg => Total: ${totalMassKg.toFixed(3)} kg`
    );
  }

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 3: Gordura calculada da Base Branca ~5,12% (meta 8%) e perfis carregados (não mais 0% nem Pendente)
  // --------------------------------------------------------------------------------------------------
  console.log('\n--- Verificação 3: Gordura da Base Branca calculada em ~5,12% frente à meta de 8% ---');
  {
    const items = baseBranca.recipe_items.map((it) => ({
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
      fatPct: { target: 8.0, tolerance: 1.0 }
    });

    const fatDiag = diags.find(d => d.parameter === 'Gordura (%)');

    // Confirma que nenhum insumo da Base Branca ficou sem perfil (não há "Perfil técnico completo não cadastrado")
    const noMissingProfiles = !metrics.dataErrors || metrics.dataErrors.length === 0;

    assert(
      Math.abs(metrics.fatPct - 5.12) < 0.02 && fatDiag?.status === 'OUT_OF_BOUNDS' && noMissingProfiles,
      'Verificação 3 (Gordura ~5,12%)',
      `Gordura calculada: ${metrics.fatPct}% (Meta: 8.00%, Tolerância: ±1.00%, Diferença: ${fatDiag?.deviation}%, Estado: ${fatDiag?.status})`
    );
  }

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 4: Prévia de Ordem de 10 kg: escala de 0,983x para Base Branca e 1,000x para Açaí (NÃO 3,333x nem 1,661x)
  // --------------------------------------------------------------------------------------------------
  console.log('\n--- Verificação 4: Escala na Ordem de Produção de 10 kg (Sem exclusão de líquidos) ---');
  {
    // Base Branca
    const bbItems = baseBranca.recipe_items.map((it) => ({
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

    // Açaí
    const acaiItems = baseAcai.recipe_items.map((it) => ({
      ingredientId: it.ingredients.id,
      ingredientName: it.ingredients.name,
      quantity: Number(it.quantity),
      unit: it.unit,
      costPerUnit: Number(it.ingredients.cost_per_unit || 0),
      isClosingIngredient: it.is_closing_ingredient,
      profile: extractTechnicalProfile(it.ingredients?.ingredient_technical_profiles)
    }));
    const acaiMetrics = calculateFormulation(acaiItems, 10000);
    const acaiRealMassKg = acaiMetrics.totalMassG / 1000;
    const acaiPlannedKg = 10.0;
    const acaiScaleRatio = acaiPlannedKg / acaiRealMassKg;

    const bbScaleOk = Math.abs(bbScaleRatio - 0.983) < 0.005; // 10 / 10.174 = 0.9829
    const acaiScaleOk = Math.abs(acaiScaleRatio - 1.000) < 0.001; // 10 / 10 = 1.000

    assert(
      bbScaleOk && acaiScaleOk && bbScaleRatio !== 3.333 && acaiScaleRatio !== 1.661,
      'Verificação 4 (Escala 10kg)',
      `Base Branca (10kg): escala = ${bbScaleRatio.toFixed(3)}x (massa real ${bbRealMassKg.toFixed(3)} kg). Açaí (10kg): escala = ${acaiScaleRatio.toFixed(3)}x (massa real ${acaiRealMassKg.toFixed(3)} kg).`
    );
  }

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 5: Bloqueio estrito quando faltar densidade de líquido ou ficha técnica (Erro de dados intransponível)
  // --------------------------------------------------------------------------------------------------
  console.log('\n--- Verificação 5: Bloqueio Estrito por Densidade Ausente ou Ficha Ausente ---');
  {
    // 5a. Líquido sem densidade
    const itemsMissingDensity = [
      {
        ingredientId: 'leite-teste',
        ingredientName: 'Leite sem densidade',
        quantity: 5.0,
        unit: 'L',
        costPerUnit: 4.0,
        profile: {
          density_g_ml: 0, // DENSIDADE INVÁLIDA / ZERO
          fat_pct: 3.5,
          is_mix_ingredient: true,
          data_status: 'CONFIRMED'
        }
      },
      {
        ingredientId: 'acucar-teste',
        ingredientName: 'Açúcar',
        quantity: 1.0,
        unit: 'kg',
        costPerUnit: 4.0,
        profile: {
          density_g_ml: 1.0,
          fat_pct: 0,
          is_mix_ingredient: true,
          data_status: 'CONFIRMED'
        }
      }
    ];

    const mNoDensity = calculateFormulation(itemsMissingDensity, 6000);
    const densityBlocked = mNoDensity.hasDataError === true && 
      mNoDensity.isProductionEligible === false &&
      mNoDensity.dataErrors.some(e => e.includes('Densidade ausente'));

    // 5b. Insumo sem ficha técnica cadastrada
    const itemsMissingProfile = [
      {
        ingredientId: 'insumo-sem-ficha',
        ingredientName: 'Insumo Misterioso',
        quantity: 2.0,
        unit: 'kg',
        costPerUnit: 10.0,
        profile: null // FICHA AUSENTE
      }
    ];

    const mNoProfile = calculateFormulation(itemsMissingProfile, 2000);
    const profileBlocked = mNoProfile.hasDataError === true &&
      mNoProfile.isProductionEligible === false &&
      mNoProfile.dataErrors.some(e => e.includes('Ficha técnica ausente'));

    assert(
      densityBlocked && profileBlocked,
      'Verificação 5 (Bloqueio Erro de Dados)',
      `Líquido sem densidade bloqueou: hasDataError=${mNoDensity.hasDataError}. Ficha ausente bloqueou: hasDataError=${mNoProfile.hasDataError}. Ambos impedem elegibilidade e início de produção.`
    );
  }

  // --------------------------------------------------------------------------------------------------
  // VERIFICAÇÃO 6: Preservação de Fichas de Venda, PDV e Estoque
  // --------------------------------------------------------------------------------------------------
  console.log('\n--- Verificação 6: Preservação de Fichas Comerciais (COMMERCIAL_ASSEMBLY), PDV e Estoque ---');
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
