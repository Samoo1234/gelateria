import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://odcqfmkmfasptnqzypcl.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kY3FmbWttZmFzcHRucXp5cGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjIzNzksImV4cCI6MjA4MDQzODM3OX0.kjsnYFiFiyikwgJMn9708XwbeUkPMCP3t65ywf821uk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedCount++;
  }
}

async function runAuthAndProductionTests() {
  console.log('================================================================');
  console.log('  GELATO MANAGER V2 - TESTES AUTOMATIZADOS DE AUTH & PRODUÇÃO');
  console.log('================================================================\n');

  // 1. TESTES DE AUTENTICAÇÃO E PIN DOS OPERADORES
  console.log('--- 1. Testes de Autenticação por PIN & Perfis ---');
  {
    // Teste PIN Caixa: 1234
    const { data: caixa, error: errCaixa } = await supabase
      .from('employees')
      .select('*')
      .eq('pin_code', '1234')
      .eq('status', 'Active')
      .single();

    assert(!errCaixa && caixa && caixa.role === 'Caixa', 'PIN 1234 autentica operador com perfil Caixa');

    // Teste PIN Fábrica: 5678
    const { data: fab, error: errFab } = await supabase
      .from('employees')
      .select('*')
      .eq('pin_code', '5678')
      .eq('status', 'Active')
      .single();

    assert(!errFab && fab && fab.role === 'Produção', 'PIN 5678 autentica operador com perfil Produção');

    // Teste PIN Admin: 9999
    const { data: admin, error: errAdmin } = await supabase
      .from('employees')
      .select('*')
      .eq('pin_code', '9999')
      .eq('status', 'Active')
      .single();

    assert(!errAdmin && admin && admin.role === 'Administrador', 'PIN 9999 autentica Administrador');

    // Teste PIN Inválido
    const { data: invalidData } = await supabase
      .from('employees')
      .select('*')
      .eq('pin_code', '0000')
      .eq('status', 'Active');

    assert(!invalidData || invalidData.length === 0, 'PIN 0000 inexistente deve ser recusado');
  }

  // 2. TESTES DE RECEITAS & ESTRUTURA PARA PRODUÇÃO
  console.log('\n--- 2. Testes de Receitas & Insumos ---');
  let sampleRecipe = null;
  {
    const { data: recipes, error: errRec } = await supabase
      .from('recipes')
      .select('id, product_id, yield, products:product_id(id, name)');

    assert(!errRec, 'Consulta de receitas para produção executada com sucesso');
    if (recipes && recipes.length > 0) {
      sampleRecipe = recipes[0];
      assert(Boolean(sampleRecipe.id), `Receita ativa identificada: ${sampleRecipe.products?.name || sampleRecipe.id}`);
    } else {
      console.log('  ⚠️ Nenhuma receita no banco para teste direto de batelada.');
    }
  }

  // 3. TESTE DE FLUXO DE ORDEM DE PRODUÇÃO (CRIAÇÃO DE LOTE)
  console.log('\n--- 3. Teste de Fluxo Operacional de Batelada ---');
  if (sampleRecipe) {
    const batchCode = `TEST-LOTE-${Date.now().toString().slice(-6)}`;
    const plannedQty = 6.0;

    const { data: batch, error: errBatch } = await supabase
      .from('production_batches')
      .insert({
        batch_code: batchCode,
        recipe_id: sampleRecipe.id,
        product_id: sampleRecipe.product_id,
        planned_quantity: plannedQty,
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString(),
        notes: 'Lote de teste automatizado'
      })
      .select()
      .single();

    assert(!errBatch && batch && batch.status === 'IN_PROGRESS', `Batelada iniciada com sucesso: ${batchCode}`);

    if (batch) {
      // Teste de cancelamento de lote de teste para manter a base limpa
      const { data: cancelled, error: errCancel } = await supabase
        .from('production_batches')
        .update({
          status: 'CANCELLED',
          notes: 'Cancelado pelo teste automatizado'
        })
        .eq('id', batch.id)
        .select()
        .single();

      assert(!errCancel && cancelled.status === 'CANCELLED', 'Lote de teste cancelado com integridade');
    }
  }

  // 4. TESTE DE TABELA DE CUBAS (TUBS)
  console.log('\n--- 4. Teste de Rastreabilidade de Cubas ---');
  {
    const { count, error } = await supabase
      .from('tubs')
      .select('*', { count: 'exact', head: true });

    assert(!error, `Tabela de cubas acessível (Total de cubas registradas: ${count})`);
  }

  console.log('\n================================================================');
  console.log(`  RESULTADO: ${passedCount} APROVADOS, ${failedCount} REPROVADOS`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAuthAndProductionTests().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
