# 📋 RELATÓRIO DO SPRINT 1 — SEGURANÇA, RBAC & BANCO SUPABASE

> **Projeto:** Gelato Manager V2  
> **Workspace:** `f:\sorveteria`  
> **Data:** 16 de Setembro de 2026  
> **Status:** SPRINT 1 CONCLUÍDO COM SUCESSO  

---

## 1. IMPLEMENTADO

1. **Correção de Vulnerabilidades de Funções:**
   - As 9 funções PL/pgSQL do banco foram atualizadas com `SET search_path = public` e `SECURITY INVOKER`, eliminando o vetor de ataque de injeção de schemas temporários (*search_path hijacking*).
2. **Correção de Views Analíticas:**
   - As 4 views analíticas (`v_products_with_cost`, `v_recipes_detailed`, `v_sales_statistics`, `v_low_stock_ingredients`) foram recriadas com `WITH (security_invoker = true)`, eliminando a execução insegura em modo superusuário (`SECURITY DEFINER`).
3. **Ativação de RLS (Row Level Security):**
   - RLS foi habilitado em **100% das 21 tabelas** públicas da instância Supabase (`odcqfmkmfasptnqzypcl`).
   - 28 políticas de segurança (*RLS Policies*) foram criadas para garantir leitura do catálogo e operação segura do PDV e caixa.
4. **Índice de Performance Criado:**
   - Índice `idx_inventory_movements_employee_id` adicionado sobre a foreign key `inventory_movements(employee_id)`.
5. **Expansão do Modelo Relacional para o Gelato Manager V2:**
   - `products`: Adicionados campos `sale_type` (`WEIGHT`, `SCOOP`, `UNIT`, `COMBO`, `ADDON`), `is_flavor` e `stock_trackable`.
   - `containers`: Tabela de recipientes (potes térmicos, copos, casquinhas) com tara pré-cadastrada e capacidade de bolas.
   - `terminals`: Cadastro de terminais/caixas (`CAIXA-01`, `CAIXA-02`).
   - `cash_register_sessions`: Controle de abertura, movimentação e fechamento de caixa.
   - `cash_movements`: Registro de sangrias e suprimentos de caixa com motivo e operador.
   - `order_payments`: Registro de múltiplos métodos de pagamento por pedido (split payment: PIX + Dinheiro + Cartão).
   - `tubs`: Rastreamento de cubas no expositor, capacidade, peso atual e status operacional.
   - `audit_logs`: Trilha de auditoria para ações financeiras e de pesagem.
   - `orders` e `order_items`: Expandidos para armazenar `session_id`, `terminal_id`, `tare_weight`, `gross_weight`, `net_weight` e `options` JSONB.
6. **Transação Server-Side `finalize_sale()`:**
   - Procedure atômica PostgreSQL criada para validação de produtos, cálculo de preços no backend (anti-tampering), gravação de pedidos, itens, pagamentos e auditoria.
7. **Limpeza Automática do Heartbeat:**
   - Cron job `limpar_atividade_heartbeat` agendado via `pg_cron` para rodar semanalmente eliminando registros com mais de 7 dias, estancando o crescimento contínuo da tabela `atividade_heartbeat`.
8. **Proteção de Secrets:**
   - `.env` removido do rastreamento do Git e adicionado ao `.gitignore`; arquivo `.env.example` criado.
9. **Sincronização TypeScript:**
   - `lib/database.types.ts` regenerado e atualizado com todos os novos schemas, tabelas e funções.

---

## 2. ARQUIVOS ALTERADOS

| Arquivo | Finalidade |
| :--- | :--- |
| `.gitignore` | Proteção de credenciais: exclusão de arquivos `.env` e `.env.*`. |
| `.env.example` | Template público de variáveis de ambiente sem expor chaves reais. |
| `supabase_sprint1_security_and_schema.sql` | Script SQL unificado contendo toda a migration do Sprint 1. |
| `lib/database.types.ts` | Tipagens TypeScript do banco sincronizadas com a nova estrutura V2. |
| `RELATORIO_SPRINT_1.md` | Documentação formal de entrega do Sprint 1. |

---

## 3. BANCO DE DADOS (SUPABASE)

- **Instância:** `odcqfmkmfasptnqzypcl` (PostgreSQL 17.6)
- **Tabelas com RLS:** 21 de 21 tabelas habilitadas.
- **Novas Tabelas Criadas:** `containers`, `terminals`, `cash_register_sessions`, `cash_movements`, `order_payments`, `tubs`, `audit_logs`.
- **Procedimentos Criados:** `public.finalize_sale(p_sale_payload JSONB)`.
- **Advisories do Supabase Linter após Sprint 1:**
  - `rls_disabled_in_public`: **0 erros** (Corrigido: era 14).
  - `security_definer_view`: **0 erros** (Corrigido: era 4).
  - `function_search_path_mutable`: **0 advertências** (Corrigido: era 9).

---

## 4. TESTES EXECUTADOS E RESULTADOS

| Teste | Descrição | Resultado |
| :--- | :--- | :---: |
| **Teste de Venda Atômica** | Chamada a `finalize_sale()` com itens e pagamento PIX correto. | ✅ **SUCESSO** (`ORD-20260916-0001` gerado com R$ 10.00, itens e pagamentos persistidos). |
| **Teste Anti-Adulteração (Valor Insuficiente)** | Tentativa de finalizar pedido de R$ 10.00 enviando pagamento de R$ 5.00. | ✅ **BLOQUEADO** (Erro P0001 com rollback atômico). |
| **Teste de Produto Inválido** | Tentativa de finalizar pedido com ID de produto inexistente. | ✅ **BLOQUEADO** (Erro P0001: Produto não encontrado ou inativo). |
| **Auditoria de Limpeza** | Exclusão controlada do pedido de teste para manter base limpa. | ✅ **SUCESSO** (Banco zerado e consistente). |

---

## 5. RESULTADO DO BUILD

- **Comando:** `npm run build` (`vite build`)
- **Status:** Exit code 0 (Sucesso).
- **Tempo:** 6.33s.
- **Módulos:** 776 transformados sem erros de compilação.

---

## 6. IMPACTOS DE SEGURANÇA

- **Eliminação de Exposição Aberta:** Nenhuma tabela do banco pode ser deletada ou adulterada arbitrariamente pela anon key sem validação de policies.
- **Preço Verificado no Banco:** O PDV não mais confia no preço enviado pela interface. O PostgreSQL consulta o catálogo oficial no momento do checkout.
- **Trilha de Auditoria:** Cada venda registrada agora grava automaticamente usuário, terminal e valores em `audit_logs`.

---

## 7. PENDÊNCIAS

- O frontend ainda carrega o Tailwind CSS via CDN no `index.html` e possui o `index.css` corrompido em UTF-16LE.
- Falta adicionar `"vite/client"` ao `tsconfig.json` para zerar o `tsc --noEmit`.
- Essas pendências são o escopo exato do **Sprint 2**.

---

## 8. PRÓXIMO PASSO: SPRINT 2 — FUNDAÇÃO FRONTEND

- Instalar Tailwind CSS localmente com PostCSS e Autoprefixer.
- Recriar `index.css` em UTF-8 com `@tailwind base; @tailwind components; @tailwind utilities;`.
- Remover a CDN e importmaps de `index.html`.
- Corrigir `tsconfig.json` (`vite/client`).
- Configurar code splitting no `vite.config.ts`.
- Validar build sem avisos e sem CDN.
