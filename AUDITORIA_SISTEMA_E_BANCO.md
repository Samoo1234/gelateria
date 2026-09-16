# 📋 Relatório de Auditoria Completa e Minuciosa: Sistema & Banco de Dados (Supabase)

> **Data da Auditoria:** 16 de Setembro de 2026  
> **Sistema Auditado:** Sorveteria Gelato Manager  
> **Workspace:** `f:\sorveteria`  
> **Auditor Responsável:** AI Security Auditor & Database Architect  
> **Ferramentas Utilizadas:** Análise estática de código-fonte, Vite Build Profiler, MCP Supabase Server (`odcqfmkmfasptnqzypcl`)

---

## 🎯 Sumário Executivo

| Métrica | Status / Nota | Diagnóstico Resumido |
| :--- | :---: | :--- |
| **Prontidão para Produção** | **35% / 100** | ⚠️ **Não pronto para produção**. Funcionalidades centrais desconectadas do banco. |
| **Segurança do Banco (Supabase)** | **CRÍTICA (F)** | 🚨 **14 de 14 tabelas com RLS desabilitado**. Exposição total via PostgREST/Anon Key. |
| **Integração Frontend-Supabase** | **25%** | Apenas 2 de 9 páginas consom dados reais; o resto opera sobre mocks estáticos. |
| **Integridade Transacional (PDV)** | **0%** | Botão "Finalizar Pedido" emite um `alert()` sem gravar dados ou debitar estoque. |
| **Desempenho & Build Frontend** | **Alerta (C)** | Tailwind carregado via CDN externa; `index.css` corrompido (UTF-16LE); JS bundle de 899 kB. |

---

## 🗄️ 1. Auditoria Completa do Banco de Dados (Via MCP Supabase)

### 1.1 Metadados da Instância Supabase
- **Project ID / Ref:** `odcqfmkmfasptnqzypcl`
- **Nome do Projeto:** `reobotegelateriasystem@gmail.com's Project`
- **Região:** `us-east-1`
- **Engine:** PostgreSQL 17.6 (Versão `17.6.1.054`)
- **Status do Cluster:** `ACTIVE_HEALTHY`
- **Extensões Ativas Relevantes:** `uuid-ossp`, `pgcrypto`, `pg_cron`, `pg_stat_statements`, `vault`

---

### 1.2 Inventário de Tabelas e Contagem Real de Registros

Através do comando de auditoria profunda via MCP, foi levantado o estado real do banco de dados na nuvem:

| Tabela | Linhas no Banco | Chave Primária | RLS Ativo? | Foreign Keys / Relacionamentos |
| :--- | :---: | :---: | :---: | :--- |
| `categories` | **5** | `id` (UUID) | ❌ **NÃO** | Referenciada por `products.category_id` |
| `products` | **10** | `id` (UUID) | ❌ **NÃO** | Ref: `categories(id)`. Ref por: `recipes`, `order_items` |
| `ingredient_categories`| **6** | `id` (UUID) | ❌ **NÃO** | Referenciada por `ingredients.category_id` |
| `suppliers` | **0** | `id` (UUID) | ❌ **NÃO** | Referenciada por `ingredients.supplier_id` |
| `ingredients` | **19** | `id` (UUID) | ❌ **NÃO** | Ref: `suppliers(id)`, `ingredient_categories(id)`. Ref por: `recipe_items`, `inventory_movements` |
| `recipes` | **6** | `id` (UUID) | ❌ **NÃO** | Ref: `products(id)` (1:1). Ref por: `recipe_items` |
| `recipe_items` | **31** | `id` (UUID) | ❌ **NÃO** | Ref: `recipes(id)`, `ingredients(id)` |
| `customers` | **0** | `id` (UUID) | ❌ **NÃO** | Referenciada por `orders.customer_id` |
| `employees` | **0** | `id` (UUID) | ❌ **NÃO** | Referenciada por `orders.employee_id`, `inventory_movements.employee_id` |
| `orders` | **0** | `id` (UUID) | ❌ **NÃO** | Ref: `customers(id)`, `employees(id)`. Ref por: `order_items` |
| `order_items` | **0** | `id` (UUID) | ❌ **NÃO** | Ref: `orders(id)`, `products(id)` |
| `inventory_movements` | **0** | `id` (UUID) | ❌ **NÃO** | Ref: `ingredients(id)`, `employees(id)` |
| `settings` | **8** | `id` (UUID) | ❌ **NÃO** | Chave única em `key`. Guarda configs do sistema |
| `atividade_heartbeat` | **3.156** | `id` (INT4) | ❌ **NÃO** | Tabela utilitária para pg_cron keep-alive |

---

### 1.3 Views Existentes no Banco

O banco possui 4 Views analíticas criadas para o cálculo em tempo real de custos, margens e estoque:

1. **`v_products_with_cost`**:
   - Calcula: preço de venda, custo total (derivado de `recipes`), lucro unitário (`price - total_cost`) e margem percentual.
2. **`v_recipes_detailed`**:
   - Constrói o agrupamento estruturado com `json_agg` de cada ingrediente, quantidade, unidade e custo do item da receita.
3. **`v_sales_statistics`**:
   - Agrupa pedidos por data (`date(order_date)`), somando receita total, total de pedidos, ticket médio e clientes únicos.
4. **`v_low_stock_ingredients`**:
   - Filtra ingredientes ativos onde `current_stock <= min_stock`, fazendo JOIN com fornecedor e categoria.

---

### 1.4 Gatilhos (Triggers) e Funções PL/pgSQL

O schema possui uma automação interna via Triggers robusta:

- **Controle de `updated_at`:** Triggers `BEFORE UPDATE` em todas as tabelas executando `update_updated_at_column()`.
- **Cálculo de Custo de Item da Receita:** Trigger `BEFORE INSERT OR UPDATE` em `recipe_items` calculando `cost = quantity * ingredient.cost_per_unit`.
- **Atualização do Custo Total da Receita:** Trigger `AFTER INSERT OR UPDATE OR DELETE` em `recipe_items` somando todos os itens e atualizando `recipes.total_cost`.
- **Atualização Automática de Estoque:** Trigger `AFTER INSERT` em `inventory_movements` debitando (`OUT`), creditando (`IN`) ou fixando (`ADJUSTMENT`) o `ingredients.current_stock`.
- **Cálculo do Total do Pedido:** Trigger `AFTER INSERT OR UPDATE OR DELETE` em `order_items` recalculando `orders.subtotal` e `orders.total`.
- **Geração de Número de Pedido:** Trigger `BEFORE INSERT` em `orders` gerando números sequenciais amigáveis (ex: `ORD-20260916-0001`).

---

### 1.5 Mecanismo Oculto: Heartbeat & pg_cron (Keep-Alive)

Foi detectado um cron job ativo na extensão `pg_cron`:
- **Job ID:** `1`
- **Job Name:** `inserir_atividade_heartbeat`
- **Agendamento:** `0 */2 * * *` (a cada 2 horas)
- **Comando:** `insert into atividade_heartbeat default values;`
- **Objetivo:** Evitar que a instância do Supabase Free Tier entre em modo `PAUSED` por inatividade.
- ⚠️ **Achado Crítico:** A tabela já acumula **3.156 registros** e **não existe um job de limpeza agendado**. Embora exista a função `reset_atividade_heartbeat()` (que executa `TRUNCATE TABLE atividade_heartbeat`), ela nunca é chamada automaticamente, gerando crescimento contínuo desnecessário.

---

## 🚨 2. Alertas Oficiais de Segurança e Desempenho (Supabase Advisors)

A consulta direta via MCP ao linter oficial do Supabase revelou vulnerabilidades críticas e advertências que precisam de atenção imediata:

### 2.1 Alertas Críticos de Segurança (Nível ERROR)

1. **RLS Desabilitado em todas as 14 tabelas públicas (`rls_disabled_in_public`):**
   - **Gravidade:** **MÁXIMA (CRITICAL)**
   - **Descrição:** As tabelas estão expostas diretamente via PostgREST. Como o cliente frontend possui a `VITE_SUPABASE_ANON_KEY`, qualquer usuário com acesso ao console do navegador ou ferramenta HTTP (Postman/cURL) pode executar operações de `DELETE`, `UPDATE` ou `INSERT` irrestritas sobre o banco de dados.
   - **Ação:** Habilitar RLS em todas as tabelas e definir políticas de acesso granulares (Row Level Security Policies).

2. **Views com `SECURITY DEFINER` (`security_definer_view`):**
   - **Gravidade:** **ALTA (ERROR)**
   - **Tabelas afetadas:** `v_low_stock_ingredients`, `v_recipes_detailed`, `v_sales_statistics`, `v_products_with_cost`.
   - **Descrição:** Views definidas com `SECURITY DEFINER` ignoram as permissões e políticas RLS do usuário que está consultando, executando com as permissões do criador da view (superuser/postgres). Podem vazar dados protegidos para usuários anônimos.

### 2.2 Advertências de Segurança (Nível WARN)

1. **Funções com `search_path` mutável (`function_search_path_mutable`):**
   - **Gravidade:** **MÉDIA (WARN)**
   - **9 funções afetadas:** `update_updated_at_column`, `update_recipe_total_cost`, `calculate_recipe_item_cost`, `update_ingredient_stock`, `calculate_order_total`, `generate_order_number`, `get_product_cost`, `get_product_margin`, `reset_atividade_heartbeat`.
   - **Risco:** Sem `SET search_path = ''` ou `public`, funções executadas com privilégios de banco são vulneráveis a ataques de injeção de schemas temporários maliciosos (*search_path hijacking*).

### 2.3 Alertas de Desempenho (Nível INFO)

1. **Foreign Key sem Índice Cobertor (`unindexed_foreign_keys`):**
   - **Tabela:** `public.inventory_movements`
   - **Coluna:** `employee_id` (`inventory_movements_employee_id_fkey`)
   - **Impacto:** Consultas filtrando ou unindo movimentações de estoque por funcionário exigirão varredura sequencial (`Seq Scan`).
   - **Remediação:** `CREATE INDEX idx_inventory_movements_employee ON inventory_movements(employee_id);`

2. **22 Índices Não Utilizados (`unused_index`):**
   - Decorrência natural do estado atual do sistema, que opera majoritariamente com dados mockados e volume nulo de tráfego de produção.

---

## 💻 3. Auditoria do Frontend e da Aplicação

### 3.1 Matriz de Realidade: Supabase Real vs. Mock Estático

A maior deficiência do projeto atual reside na desconexão entre a camada de apresentação (telas) e a camada de dados (Supabase):

| Página | Rota | Consome Supabase? | Estado Real da Implementação |
| :--- | :--- | :---: | :--- |
| **Dashboard** | `/dashboard` | ❌ **NÃO** | **100% Mock**. Métricas de hoje (R$ 1.250,50, 83 pedidos) e gráficos usam arrays estáticos de `constants.ts`. Não consome `v_sales_statistics`. |
| **PDV (Novo Pedido)** | `/pos` | ❌ **NÃO** | **100% Mock**. Produtos vêm de `constants.ts`. Botão "Finalizar Pedido" apenas dispara `alert('Pedido finalizado!')`. Nenhuma gravação em `orders` ou baixa em estoque. |
| **Produtos** | `/products` | ✅ **SIM** | **Conectado via `useProducts()`**. Lê da view `v_products_with_cost` no Supabase. Falta formulário completo de cadastro/edição com imagem e categoria dinâmica. |
| **Ingredientes** | `/ingredients`| ❌ **NÃO** | **Mock via `constants.ts`**. O hook `useIngredients.ts` e `ingredientService.ts` **foram criados, mas a página não os importa**. Modal exibe mensagem: *"Funcionalidade de edição será implementada com gerenciamento de estado."* |
| **Receitas** | `/recipes` | ✅ **SIM** | **Conectado via `useRecipes()`**. Lista receitas do Supabase e calcula custos reais. Modal de nova receita funcional. |
| **Controle de Estoque**| `/inventory` | ❌ **NÃO** | **100% Mock**. Dados estáticos (`124 itens`, `R$ 8.450,00`). Botões de "Adicionar Item" e "Exportar" sem funções vinculadas. |
| **Relatórios** | `/reports` | ❌ **NÃO** | **100% Mock**. Filtros de data, categoria e pagamento não filtram nada; gráficos estáticos. |
| **Análise de Custos** | `/cost-analysis`| ❌ **NÃO** | **100% Mock**. Realiza cálculos sobre `RECIPES` e `PRODUCTS` de `constants.ts` em vez de consumir a view `v_products_with_cost`. |
| **Funcionários** | `/employees` | ❌ **NÃO** | **100% Mock**. Tabela e formulário puramente visuais, sem persistência ou busca real. |
| **Configurações** | `/settings` | ❌ **NÃO** | **Apenas LocalStorage**. `settingsService.ts` existe no código, mas `Settings.tsx` não o consome, gravando apenas tema dark/light localmente. |

---

### 3.2 Análise dos Serviços e Hooks

- **Serviços Existentes:**
  - `productService.ts` ✅ Implementado
  - `ingredientService.ts` ✅ Implementado (porém subutilizado pela tela)
  - `recipeService.ts` ✅ Implementado
  - `settingsService.ts` ✅ Implementado (porém ignorado pela tela)
- **Serviços Faltantes (Ausentes no Código):**
  - ❌ `orderService.ts` (Criação de pedidos, itens, finalização transacional)
  - ❌ `inventoryService.ts` (Movimentações `IN`, `OUT`, `ADJUSTMENT` e histórico)
  - ❌ `customerService.ts` (Gestão de clientes e histórico de compras)
  - ❌ `employeeService.ts` (Gestão de funcionários, funções e status)
  - ❌ `reportService.ts` (Consumo da view `v_sales_statistics` e relatórios de fluxo)

---

### 3.3 Problemas Estruturais de Build e Estilização

1. **Tailwind CSS via CDN externa (`index.html`):**
   - O projeto está importando `<script src="https://cdn.tailwindcss.com?...">` em tempo de execução.
   - **Impactos:**
     - Falha de segurança e dependência de rede externa.
     - Efeito FOUC (*Flash of Unstyled Content*) no carregamento da página.
     - Impossibilidade de *purging* (remover CSS não utilizado), resultando em overhead desnecessário.
     - Viola as boas práticas de produção de aplicações Vite/React.
2. **`index.css` Corrompido com Encoding Inválido:**
   - O arquivo `index.css` contém 6 bytes em codificação `UTF-16LE` com apenas quebras de linha (`FF FE 0D 00 0A 00`).
   - Durante o `vite build`, o esbuild dispara o aviso: `▲ [WARNING] Expected "{" but found end of file [css-syntax-error]`.
3. **Chunk Único Gigante de JavaScript:**
   - O bundle compilado gera um arquivo único de **899.16 kB** (`dist/assets/index-*.js`).
   - Não há divisão de código (*code splitting*) com `React.lazy()` / `Suspense` para as rotas secundárias (Relatórios, Análise de Custo, etc.).

---

## 🔒 4. Análise de Segurança em Profundidade (OWASP 2025)

| Categoria OWASP | Status | Detalhamento no Projeto |
| :--- | :---: | :--- |
| **A01: Broken Access Control** | 🚨 **CRÍTICO** | RLS desabilitado em todas as tabelas. Nenhuma validação de quem pode criar/apagar produtos ou ver margens de lucro. |
| **A02: Security Misconfiguration** | ⚠️ **ALTO** | Views com `SECURITY DEFINER`; funções sem fixação de `search_path`. Arquivo `.env` presente no workspace sem exclusão explícita no `.gitignore` (`.gitignore` só ignora `*.local`). |
| **A03: Software Supply Chain** | 🟡 **MÉDIO** | Tailwind carregado via CDN externa em vez de pacote npm auditado no `package-lock.json`. |
| **A04: Cryptographic Failures** | 🟢 **ADEQUADO** | Comunicação com Supabase via HTTPS/TLS 1.3 obrigatório. |
| **A05: Injection** | 🟢 **ADEQUADO** | Consultas frontend usam SDK oficial Supabase (PostgREST parametrizado); triggers do banco usam queries preparadas. |
| **A06: Insecure Design** | 🚨 **CRÍTICO** | A arquitetura do PDV confia 100% no cliente: preço e estoque não são orquestrados por uma transação segura ponta-a-ponta. |
| **A07: Authentication Failures** | 🚨 **CRÍTICO** | **Zero autenticação**. `auth.users` possui 0 usuários. Não existe tela de login, sessão de operador ou separação entre Caixa e Administrador. |
| **A08: Integrity Failures** | ⚠️ **ALTO** | O método `createRecipe` em `recipeService.ts` simula atomicidade no cliente: se a gravação de itens falhar, tenta disparar um `delete()` manual. Se a aba for fechada no meio, o banco fica inconsistente. |
| **A09: Logging & Monitoring** | 🟡 **MÉDIO** | Não há auditoria de ações de usuários (quem alterou preço, quem excluiu receita). |

---

## 🛠️ 5. Plano de Ação Recomendado (Roadmap de Correções)

### Fase 1: Segurança Crítica & Banco de Dados (Prioridade Imediata)
1. **Ativação de RLS e Criação de Políticas:**
   ```sql
   -- 1. Habilitar RLS nas tabelas operacionais
   ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
   ALTER TABLE products ENABLE ROW LEVEL SECURITY;
   ALTER TABLE ingredient_categories ENABLE ROW LEVEL SECURITY;
   ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
   ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
   ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
   ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
   ```
2. **Correção das Views e Funções:**
   - Recriar as 4 views com `security_invoker = true` (recurso nativo do Postgres 15+ no Supabase).
   - Adicionar `SET search_path = public;` nas 9 funções PL/pgSQL.
3. **Criação do Índice de Performance:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_inventory_movements_employee_id ON public.inventory_movements(employee_id);
   ```
4. **Job de Limpeza do Heartbeat:**
   - Adicionar cron semanal ou mensal para podar a tabela `atividade_heartbeat`:
   ```sql
   SELECT cron.schedule('limpar_heartbeat_mensal', '0 3 1 * *', 'DELETE FROM public.atividade_heartbeat WHERE data_hora < NOW() - INTERVAL ''15 days'';');
   ```

---

### Fase 2: Conexão do Frontend com o Supabase (Prioridade Alta)
1. **Conectar Tela de Ingredientes (`pages/Ingredients.tsx`):**
   - Substituir `import { INGREDIENTS } from '../constants'` pelo hook `useIngredients()`.
   - Ativar modais reais de Adicionar e Editar com persistência via `createIngredient` e `updateIngredient`.
2. **Implementar Fluxo Completo de PDV (`pages/NewOrder.tsx`):**
   - Consumir produtos reais via `useProducts()`.
   - Criar `orderService.createOrder()` que insere `orders`, `order_items` e registra `inventory_movements` (baixa de insumos/produtos).
3. **Conectar Dashboard & Relatórios (`Dashboard.tsx` & `Reports.tsx`):**
   - Consultar `v_sales_statistics` para exibir faturamento, ticket médio e pedidos reais do dia/semana.
4. **Conectar Tela de Configurações (`pages/Settings.tsx`):**
   - Conectar com `getSettings()` e `updateSettings()` de `settingsService.ts`.

---

### Fase 3: Modernização de Build e Infraestrutura (Prioridade Média)
1. **Migrar Tailwind para Build Nativo:**
   - Instalar `@tailwindcss/vite` ou Tailwind via PostCSS.
   - Limpar o `index.html`, removendo `<script src="https://cdn.tailwindcss.com">`.
   - Recriar `index.css` em UTF-8 com as diretivas oficiais.
2. **Implementar Autenticação Básica (Supabase Auth):**
   - Integrar login com email/senha para os funcionários cadastrados na tabela `employees`.
3. **Adicionar `.env` no `.gitignore`:**
   - Assegurar que credenciais de produção não sejam versionadas em repositórios remotos.

---

## 📌 Conclusão

O sistema **Sorveteria Gelato Manager** possui uma **modelagem de banco de dados relacional muito bem arquitetada** no Supabase (com triggers automáticos de custo, estoque e numeração de pedidos).

Entretanto, **o sistema ainda opera majoritariamente como uma maquete visual no frontend**, com o PDV e telas de gestão dependentes de dados estáticos falsos, além de apresentar uma **vulnerabilidade crítica de segurança** com RLS totalmente desativado em nuvem.

Seguindo o plano de ação acima, o sistema estará seguro, performático e pronto para operação comercial real.
