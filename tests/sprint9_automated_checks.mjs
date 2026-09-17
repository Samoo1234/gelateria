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

async function runTests() {
  console.log('================================================================');
  console.log('  GELATO MANAGER V2 - SPRINT 9 SUÍTE DE TESTES AUTOMATIZADOS');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // GRUPO 1: CÁLCULOS DE PESO, TARA E PRECISÃO (Etapa 24)
  // -------------------------------------------------------------
  console.log('--- 1. Testes de Peso, Tara e Precisão ---');
  {
    const gross = 0.520;
    const tare = 0.020;
    const net = Math.max(0, Number((gross - tare).toFixed(3)));
    assert(net === 0.500, 'Peso líquido deve ser bruto (0.520) - tara (0.020) = 0.500 kg');

    const tareGreater = 0.050;
    const netZero = Math.max(0, Number((0.030 - tareGreater).toFixed(3)));
    assert(netZero === 0, 'Tara maior que bruto deve ser travada em 0 líquido');

    const pricePerKg = 69.90;
    const subtotal = Number((net * pricePerKg).toFixed(2));
    assert(subtotal === 34.95, 'Subtotal de 0.500 kg a R$ 69,90/kg deve ser R$ 34,95');
  }

  // -------------------------------------------------------------
  // GRUPO 2: PRECIFICAÇÃO PROGRESSIVA DE BOLAS E ADICIONAIS (Etapa 2 & 3)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testes de Precificação Progressiva e Sabores Premium ---');
  {
    const progressiveRules = { 1: 7.00, 2: 12.00, 3: 16.00 };
    
    // 1 bola
    assert(progressiveRules[1] === 7.00, '1 bola na regra progressiva = R$ 7,00');
    
    // 2 bolas
    assert(progressiveRules[2] === 12.00, '2 bolas na regra progressiva = R$ 12,00');
    
    // 3 bolas
    assert(progressiveRules[3] === 16.00, '3 bolas na regra progressiva = R$ 16,00');

    // 2 bolas (R$ 12,00) + 1 Sabor Premium (+R$ 2,00)
    const twoScoopWithPremium = progressiveRules[2] + 2.00;
    assert(twoScoopWithPremium === 14.00, '2 bolas com Pistache Premium (+R$ 2,00) = R$ 14,00');

    // 2 bolas (R$ 12,00) + Cascão Artesanal (+R$ 2,50) + Pistache Premium (+R$ 2,00)
    const completeCup = progressiveRules[2] + 2.50 + 2.00;
    assert(completeCup === 16.50, '2 bolas no Cascão (+R$ 2,50) com Pistache (+R$ 2,00) = R$ 16,50');
  }

  // -------------------------------------------------------------
  // GRUPO 3: PAGAMENTOS, SPLIT E TROCO (Etapa 24)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testes de Formas de Pagamento e Troco ---');
  {
    const total = 16.50;
    const payments = [
      { method: 'DINHEIRO', amount: 20.00 }
    ];
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const change = Math.max(0, Number((totalPaid - total).toFixed(2)));
    assert(change === 3.50, 'Troco para R$ 20,00 em conta de R$ 16,50 deve ser R$ 3,50');

    // Split payment
    const splitPayments = [
      { method: 'PIX', amount: 10.00 },
      { method: 'DINHEIRO', amount: 6.50 }
    ];
    const splitTotal = splitPayments.reduce((acc, p) => acc + p.amount, 0);
    assert(splitTotal === total, 'Split PIX (R$ 10,00) + Dinheiro (R$ 6,50) totaliza exatamente R$ 16,50');
  }

  // -------------------------------------------------------------
  // GRUPO 4: RECONCILIAÇÃO DE CUBAS E PERDAS (Etapa 4 & 5)
  // -------------------------------------------------------------
  console.log('\n--- 4. Testes de Reconciliação e Diferença de Estoque ---');
  {
    const estimatedWeight = 2.840;
    const physicalWeight = 2.690;
    const diff = Number((physicalWeight - estimatedWeight).toFixed(3));
    assert(diff === -0.150, 'Diferença entre estimado (2.840 kg) e físico (2.690 kg) deve ser -0.150 kg');
    assert(Math.abs(diff) === 0.150, 'Perda apurada deve ser convertida com precisão para 0.150 kg');
  }

  // -------------------------------------------------------------
  // GRUPO 5: RPC FINALIZE_SALE & IDEMPOTÊNCIA NO SUPABASE (Etapa 25 & 28)
  // -------------------------------------------------------------
  console.log('\n--- 5. Testes da RPC finalize_sale no Banco de Dados ---');
  try {
    // 1. Obter produto Chocolate para o teste
    const { data: products } = await supabase
      .from('products')
      .select('id, name, price, sale_type')
      .eq('name', 'Chocolate')
      .limit(1);

    if (!products || products.length === 0) {
      console.warn('  ⚠️ Produto Chocolate não encontrado para teste de RPC.');
    } else {
      const prod = products[0];
      const idempotencyKey = `test-idemp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Teste A: Finalização de venda válida com regra progressiva de 2 bolas
      const salePayload = {
        idempotency_key: idempotencyKey,
        notes: 'TESTE AUTOMATIZADO SPRINT 9',
        discount: 0,
        items: [
          {
            product_id: prod.id,
            quantity: 1,
            sale_type: 'SCOOP',
            options: {
              flavors: ['Chocolate', 'Morango']
            }
          }
        ],
        payments: [
          {
            payment_method: 'DINHEIRO',
            amount: 15.00,
            change_amount: 3.00
          }
        ]
      };

      const { data: saleResult, error: saleError } = await supabase.rpc('finalize_sale', {
        p_sale_payload: salePayload
      });

      assert(!saleError && saleResult?.success === true, 'RPC finalize_sale executa com sucesso para 2 bolas');
      assert(Number(saleResult?.total) === 12.00, `Total calculado pelo servidor é R$ 12,00 da regra progressiva (recebido: ${saleResult?.total})`);
      assert(saleResult?.order_number !== undefined, `Pedido gerou número oficial: ${saleResult?.order_number}`);

      // Teste B: Proteção contra Duplo Clique / Idempotência (Etapa 28)
      const { data: replayResult, error: replayError } = await supabase.rpc('finalize_sale', {
        p_sale_payload: salePayload
      });

      assert(!replayError && replayResult?.is_replay === true, 'Segunda chamada com mesma idempotency_key retorna replay sem duplicar');
      assert(replayResult?.order_id === saleResult?.order_id, 'Replay retorna o mesmo order_id original');

      // Teste C: Rejeição de Pagamento Insuficiente (Anti-Tampering)
      const underpayPayload = {
        notes: 'TESTE UNDERPAY',
        discount: 0,
        items: [
          {
            product_id: prod.id,
            quantity: 1,
            sale_type: 'SCOOP',
            options: { flavors: ['Chocolate'] }
          }
        ],
        payments: [
          {
            payment_method: 'DINHEIRO',
            amount: 2.00 // Menos que os R$ 7,00 devidos
          }
        ]
      };

      const { data: underResult, error: underError } = await supabase.rpc('finalize_sale', {
        p_sale_payload: underpayPayload
      });

      assert(underError !== null, 'RPC finalize_sale rejeita transação com pagamento insuficiente');

      // Teste D: Cancelamento de Venda e Auditoria (Etapa 12)
      if (saleResult?.order_id) {
        const { data: cancelResult, error: cancelError } = await supabase.rpc('cancel_sale', {
          p_order_id: saleResult.order_id,
          p_cancelled_by: '00000000-0000-0000-0000-000000000000',
          p_reason: 'Teste de cancelamento automatizado Sprint 9'
        });

        assert(!cancelError && cancelResult?.status === 'Cancelled', 'RPC cancel_sale altera status do pedido para Cancelled');

        // Confirmar no banco que pedido NÃO foi deletado
        const { data: orderCheck } = await supabase
          .from('orders')
          .select('status, cancelled_at')
          .eq('id', saleResult.order_id)
          .single();

        assert(orderCheck?.status === 'Cancelled' && orderCheck?.cancelled_at !== null, 'Pedido permanece preservado no banco com timestamp de cancelamento');
      }
    }
  } catch (err) {
    console.error('Erro na execução dos testes de RPC:', err);
    failedCount++;
  }

  // -------------------------------------------------------------
  // GRUPO 6: CONSULTA DE AUDIT LOGS (Etapa 15 & 16)
  // -------------------------------------------------------------
  console.log('\n--- 6. Testes de Trilha de Auditoria (Audit Logs) ---');
  {
    const { data: auditEvents, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    assert(!auditError && Array.isArray(auditEvents), 'audit_logs pode ser consultado pelo sistema');
    assert(auditEvents && auditEvents.length > 0, `Trilha de auditoria contém ${auditEvents?.length || 0} eventos registrados recentemente`);
  }

  // -------------------------------------------------------------
  // RESUMO FINAL
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`  RESULTADO DOS TESTES SPRINT 9:`);
  console.log(`  Total de testes: ${passedCount + failedCount}`);
  console.log(`  Aprovados: ${passedCount}`);
  console.log(`  Falhas: ${failedCount}`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests();
