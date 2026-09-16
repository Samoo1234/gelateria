# 🍦 AUDITORIA & ESTABILIZAÇÃO — GELATO MANAGER V2 (SPRINT 0)

> **Projeto:** Gelato Manager V2  
> **Workspace:** `f:\sorveteria`  
> **Data:** 16 de Setembro de 2026  
> **Status:** SPRINT 0 CONCLUÍDO (Estabilização & Planejamento Arquitetural)  
> **Baseline Git:** Commit `chore: baseline backup before Gelato Manager V2 Sprint 0` inicializado e registrado localmente.

---

## 📑 Índice
1. [Sumário Executivo do Sprint 0](#1-sumário-executivo-do-sprint-0)
2. [Diagnóstico Detalhado do Tailwind CSS (10 Perguntas Obrigatórias)](#2-diagnóstico-detalhado-do-tailwind-css)
3. [Auditoria da Infraestrutura Frontend & Build](#3-auditoria-da-infraestrutura-frontend--build)
4. [Auditoria de Banco de Dados & Supabase (Via MCP)](#4-auditoria-de-banco-de-dados--supabase)
5. [Mapeamento de Mocks vs. Dados Reais](#5-mapeamento-de-mocks-vs-dados-reais)
6. [Matriz Arquitetural: KEEP, REFACTOR, REPLACE, REMOVE, CREATE](#6-matriz-arquitetural)
7. [Decisão de Arquitetura & Plano de Execução por Sprints](#7-decisão-de-arquitetura)

---

## 1. Sumário Executivo do Sprint 0

A auditoria inicial minuciosa confirmou que o **Gelato Manager** possui uma fundação sólida em banco de dados relacional e design visual, mas sofre de três problemas estruturais críticos:
1. **Frontend Desconectado do Build CSS:** Estilização inteiramente dependente de uma CDN externa (`cdn.tailwindcss.com`) em runtime, com `index.css` corrompido em UTF-16LE gerando warnings no Vite e bundle CSS de apenas 0.02 kB.
2. **Camada de Apresentação com 78% de Mocks:** Das 9 páginas do sistema, 7 não consom a API do Supabase (operando puramente com arrays estáticos de `constants.ts`). O PDV (`/pos`) é um protótipo visual cujo botão "Finalizar Pedido" emite apenas um `alert()`.
3. **Exposição Total de Segurança (RLS Inativo):** As 14 tabelas no Supabase estão com Row Level Security (RLS) desabilitado e sem autenticação configurada, permitindo acesso total anônimo via PostgREST.

O repositório foi protegido com a criação de um repositório Git local e commit de baseline seguro.

---

## 2. Diagnóstico Detalhado do Tailwind CSS

Em conformidade com a diretriz mestre, foram respondidas as 10 questões técnicas fundamentais:

### 1. Como o Tailwind está sendo carregado atualmente?
O Tailwind **não faz parte do pipeline de compilação**. Ele é requisitado sob demanda pelo navegador através de uma tag `<script>` externa:
```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
```
Isso força o navegador do usuário a baixar o motor JIT do Tailwind em JavaScript a cada carregamento, compilar as classes em memória e injetá-las no DOM.

### 2. Onde está sendo injetado?
No `<head>` do arquivo `index.html` (linhas 7 a 60), acompanhado por um bloco inline de configuração global:
```html
<script>
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: { ... }
    }
  };
</script>
```

### 3. Qual versão/estratégia está efetivamente em uso?
- **Estratégia:** Tailwind Play CDN (ambiente voltado para prototipação e testes rápidos).
- **Versão:** Tailwind CSS v3.x compilado via CDN com plugins `@tailwindcss/forms` e `@tailwindcss/container-queries` anexados por query params.

### 4. Existe Tailwind instalado pelo npm simultaneamente?
**NÃO.** Foi realizada busca no `package.json`, `package-lock.json` e na pasta `node_modules`. Nenhum pacote relacionado (`tailwindcss`, `@tailwindcss/vite`, `postcss`, `autoprefixer`) está instalado ou declarado.

### 5. Existe configuração duplicada?
- Não há arquivos `tailwind.config.js`, `tailwind.config.ts` ou `postcss.config.js` no sistema de arquivos.
- **Redundância Encontrada:** O `index.html` (linhas 61 a 92) possui uma tag `<style>` com definições redundantes de fontes (`Varela Round`, `Nunito Sans`) e scrollbars personalizadas.
- **Injeção de Terceiros Irregular:** O `index.html` (linhas 93 a 103) contém um bloco `<script type="importmap">` apontando React e React Router para `https://aistudiocdn.com/...`. Este bloco entra em conflito com as dependências reais instaladas no `node_modules` e bundladas pelo Vite.

### 6. Quais arquivos dependem da configuração atual?
Praticamente **todos os componentes e telas do sistema** dependem das extensões definidas no inline config:
- **Cores Customizadas:** `bg-background-light`, `dark:bg-background-dark`, `bg-surface-light`, `dark:bg-surface-dark`, `primary`, `secondary`, `cta`, `coffee-brown`, `cream`, `mint`, `strawberry`, `vanilla`.
- **Tipografia Customizada:** `font-display` (`Varela Round`), `font-body` (`Nunito Sans`).
- **Efeitos de Vidro e Transição:** `shadow-glass`, `shadow-glass-hover`, `ease-fluid`, `bounce-soft`.
- **Telas afetadas:** `Dashboard.tsx`, `NewOrder.tsx`, `Products.tsx`, `Ingredients.tsx`, `Recipes.tsx`, `Inventory.tsx`, `Reports.tsx`, `CostAnalysis.tsx`, `Employees.tsx`, `Settings.tsx`, `Layout.tsx`, `Sidebar.tsx`, `RecipeModal.tsx`.

### 7. Estado real do index.css
- O arquivo `index.css` é um binário corrompido de 6 bytes codificado em `UTF-16LE` com BOM (`FF FE 0D 00 0A 00` = apenas `\r\n`).
- Não possui nenhuma regra CSS válida nem diretivas `@tailwind`.
- Durante a execução do `vite build`, o esbuild emite o aviso:
  `▲ [WARNING] Expected "{" but found end of file [css-syntax-error]`.

### 8. Impacto da remoção pura e simples da CDN
A simples remoção da tag `<script src="https://cdn.tailwindcss.com">` tornará a aplicação **100% sem estilo** (*naked HTML*), tornando botões invisíveis, telas desformatadas e quebrando a usabilidade completa do sistema.

### 9. Estratégia segura de migração (Sprint 2)
A migração deve ser realizada com risco zero de regressão visual:
1. Instalar no `devDependencies`: `tailwindcss@^3.4.17`, `postcss@^8.4.49`, `autoprefixer@^10.4.20`, `@tailwindcss/forms@^0.5.10`, `@tailwindcss/container-queries@^0.1.1`.
2. Criar `postcss.config.js` oficial integrado ao Vite.
3. Criar `tailwind.config.js` canônico transferindo todas as variáveis de `extend` (cores, fontes, shadows, easings) e o `darkMode: 'class'`.
4. Recriar `index.css` em `UTF-8` puro contendo:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
5. Importar `import './index.css';` em `index.tsx`.
6. Limpar `index.html`: remover a CDN do Tailwind, o script inline do config e o `importmap` obsoleto.
7. Executar `npm run build` e comprovar que o arquivo CSS gerado em `dist/assets/*.css` possui tamanho coerente (~30-50 kB minificado com purge) e zero warnings.

### 10. Resultado atual do build
- **Comando:** `npm run build` (`vite build`)
- **Status:** Exit code 0 (com avisos).
- **Tempo de compilação:** ~5.73s.
- **Artefatos gerados:**
  - `dist/index.html`: 3.64 kB
  - `dist/assets/index-CeCDWw7O.css`: **0.02 kB** (vazio, Tailwind ausente do bundle)
  - `dist/assets/index-B5l79sOO.js`: **899.16 kB** (chunk único excessivo, sem code splitting)
- **Verificação TypeScript (`npx tsc --noEmit`):** **FALHA (Exit Code 1)**
  - `lib/supabase.ts(3,33): error TS2339: Property 'env' does not exist on type 'ImportMeta'`
  - Causa: Falta de referência a `"vite/client"` em `tsconfig.json` ou arquivo `vite-env.d.ts`.

---

## 3. Auditoria da Infraestrutura Frontend & Build

| Arquivo / Config | Diagnóstico Atual | Ação Necessária |
| :--- | :--- | :--- |
| `package.json` | React 19.2, Vite 6.2, Recharts 3.5, Supabase JS 2.86. Dependências essenciais em dia. | Adicionar dependências do Tailwind e PostCSS; adicionar lucide-react para ícones nativos sem depender de fonte remota do Google. |
| `tsconfig.json` | Configurado para `bundler` e `node`, mas sem `"vite/client"`. | Adicionar `vite/client` no array `types` para corrigir tipagem de `import.meta.env`. |
| `vite.config.ts` | Alias `@` apontando para raiz. Injeções manuais de `process.env.GEMINI_API_KEY`. | Manter base, adicionar configuração de `rollupOptions.output.manualChunks` para code splitting. |
| `App.tsx` | `HashRouter` com 11 rotas estáticas carregadas sincronicamente. | Implementar `React.lazy()` e `<Suspense fallback={<Loading />}>`. Separar Layout do PDV (`/pos`) do Layout Administrativo. |
| `index.html` | Contaminado com Tailwind CDN, inline config, styles manuais e importmap. | Higienização completa. |

---

## 4. Auditoria de Banco de Dados & Supabase

Conforme inspeção em tempo real via **MCP Supabase Server** no projeto `odcqfmkmfasptnqzypcl` (PostgreSQL 17.6 em `us-east-1`):

### 4.1 Inventário de Tabelas
- **Tabelas Operacionais com Dados:**
  - `categories`: 5 linhas
  - `products`: 10 linhas
  - `ingredients`: 19 linhas
  - `ingredient_categories`: 6 linhas
  - `recipes`: 6 linhas
  - `recipe_items`: 31 linhas
  - `settings`: 8 linhas
- **Tabelas Zeradas:**
  - `orders`: 0 linhas
  - `order_items`: 0 linhas
  - `customers`: 0 linhas
  - `employees`: 0 linhas
  - `suppliers`: 0 linhas
  - `inventory_movements`: 0 linhas
- **Tabela Heartbeat:**
  - `atividade_heartbeat`: **3.156 linhas** geradas por `cron.job` a cada 2h (`0 */2 * * *`) para evitar suspensão do free tier. Necessita de cron para retenção de 15 dias.

### 4.2 Segurança do Banco (Advisories Oficiais)
- 🚨 **CRÍTICO:** RLS desativado nas 14 tabelas públicas.
- ⚠️ **ALTO:** 4 views analíticas (`v_products_with_cost`, `v_recipes_detailed`, `v_sales_statistics`, `v_low_stock_ingredients`) definidas com `SECURITY DEFINER`.
- ⚠️ **MÉDIO:** 9 funções PL/pgSQL com `search_path` mutável.
- ℹ️ **PERFORMANCE:** Faltando índice na chave estrangeira `inventory_movements(employee_id)`.

---

## 5. Mapeamento de Mocks vs. Dados Reais

| Recurso / Tela | Fonte Atual | Dados Reais no Supabase? | Gap de Integração |
| :--- | :--- | :---: | :--- |
| **Produtos** | `Products.tsx` | ✅ SIM (10 produtos) | Integrado via `useProducts()`. Falta modal completo de criação/edição. |
| **Receitas** | `Recipes.tsx` | ✅ SIM (6 receitas, 31 itens) | Integrado via `useRecipes()`. |
| **PDV (Novo Pedido)** | `NewOrder.tsx` | ❌ NÃO (`constants.ts`) | **Crítico.** Botão finaliza com `alert()`. Nenhuma gravação em `orders`, `order_items` ou `inventory_movements`. |
| **Ingredientes** | `Ingredients.tsx` | ❌ NÃO (`constants.ts`) | `useIngredients.ts` e `ingredientService.ts` existem no código, mas a tela importa o mock de `constants.ts`. |
| **Estoque** | `Inventory.tsx` | ❌ NÃO (`constants.ts`) | Métrica falsa de 124 itens e R$ 8.450. Sem conexão com `inventory_movements`. |
| **Dashboard** | `Dashboard.tsx` | ❌ NÃO (`constants.ts`) | Vendas de R$ 1.250,50 e gráficos estáticos. Não consulta `v_sales_statistics`. |
| **Relatórios** | `Reports.tsx` | ❌ NÃO (`constants.ts`) | Filtros visuais sem ação; dados puramente mockados. |
| **Análise de Custos**| `CostAnalysis.tsx` | ❌ NÃO (`constants.ts`) | Calcula margens sobre arrays estáticos, ignorando a view `v_products_with_cost`. |
| **Funcionários** | `Employees.tsx` | ❌ NÃO (`constants.ts`) | Formulário e listagem sem persistência no banco. |
| **Configurações** | `Settings.tsx` | ❌ NÃO (Apenas `localStorage`) | `settingsService.ts` existe, mas não é chamado pela tela. |

---

## 6. Matriz Arquitetural

Com base nos princípios de não recriar o projeto do zero e preservar tudo que estiver funcional, apresentamos a classificação de cada módulo:

| Módulo / Arquivo | Classificação | Justificativa e Ação |
| :--- | :---: | :--- |
| **Banco: Tabelas Existentes** | `KEEP` | `categories`, `products`, `ingredients`, `recipes`, `recipe_items`, `customers`, `orders`, `order_items`, `inventory_movements`, `settings` possuem modelagem correta e triggers eficientes. Serão mantidas integralmente. |
| **Banco: Triggers e Funções de Custos** | `KEEP` | Cálculo de custo de receita, total de pedido e atualização de estoque funcionam perfeitamente. Apenas fixar `search_path = public`. |
| **Banco: Heartbeat (`atividade_heartbeat`)** | `REFACTOR` | Manter a rotina para evitar suspensão da instância free tier, mas criar cron de expurgo para evitar acúmulo infinito de dados. |
| **Banco: Views Analíticas** | `REFACTOR` | Recriar com `WITH (security_invoker = true)` para obedecer RLS de forma segura. |
| **Banco: RLS & Políticas** | `CREATE` | Habilitar RLS nas 14 tabelas públicas e criar políticas por perfil e contexto operacional. |
| **Banco: Extensão do Modelo (V2)** | `CREATE` | Adicionar suporte a formas de venda em `products` (`sale_type`: `WEIGHT`, `SCOOP`, `UNIT`, `COMBO`, `ADDON`), cadastro de recipientes/taras (`containers`), cadastro de cubas (`tubs`), cadastro de sessões de caixa (`cash_register_sessions`) e pagamentos múltiplos (`order_payments`). |
| **Banco: Transação `finalize_sale`** | `CREATE` | Função PL/pgSQL transacional atômica para gravação de pedido, cálculo server-side de preço, baixa em estoque e auditoria. |
| **Build: index.html** | `REFACTOR` | Remover Tailwind CDN, importmaps externos e scripts inline. |
| **Build: index.css** | `REPLACE` | Substituir o binário UTF-16LE corrompido por arquivo UTF-8 padrão com diretivas Tailwind e tokens globais. |
| **Build: tsconfig.json** | `REFACTOR` | Adicionar `"vite/client"` para validar `import.meta.env` sem erros de compilação. |
| **Build: vite.config.ts** | `REFACTOR` | Adicionar PostCSS/Tailwind pipeline e divisão de chunks (`manualChunks`). |
| **Design System: MASTER.md** | `KEEP` | A paleta de cores (Primary `#3B82F6`, Secondary `#60A5FA`, CTA `#F97316`), tipografia e espaçamentos são coerentes e serão traduzidos para tokens do Tailwind. |
| **Components: Layout & Sidebar** | `REFACTOR` | Manter para navegação administrativa, tornando responsivo e integrado com rotas dinâmicas. |
| **Components: RecipeModal.tsx** | `KEEP` | Modal funcional e integrado ao hook de receitas. |
| **Pages: Products.tsx & Recipes.tsx** | `REFACTOR` | Conectadas ao Supabase. Adicionar modais completos de criação/edição e validações. |
| **Pages: Ingredients.tsx** | `REFACTOR` | Conectar ao `useIngredients()` e `ingredientService.ts` já existentes. Eliminar placeholder. |
| **Pages: CostAnalysis.tsx** | `REFACTOR` | Migrar para consumir `v_products_with_cost` do Supabase em vez de `constants.ts`. |
| **Pages: Settings.tsx** | `REFACTOR` | Integrar com `settingsService.ts` para persistir dados da loja, moeda, balança e taras no Supabase. |
| **Pages: Inventory.tsx** | `REFACTOR` | Conectar com `inventory_movements` e ingredientes reais. |
| **Pages: Dashboard.tsx & Reports.tsx**| `REFACTOR` | Conectar à view `v_sales_statistics` e tabelas reais de vendas. |
| **Pages: Employees.tsx** | `REFACTOR` | Conectar à tabela `employees` do banco e associar a perfis de acesso. |
| **PDV: NewOrder.tsx** | `REPLACE` | Substituir pela nova interface **PDV Touchscreen-First V2**: fluxo por quilo (tara + balança), por bola (recipiente + sabores), unitário, adicionais, carrinho permanente e pagamento multi-método transacional. |
| **PDV: ScaleAdapter (Balança)** | `CREATE` | Abstração em TypeScript para leitura de peso com drivers: `ManualScaleAdapter` (com auditoria) e `WebSerialScaleAdapter`. |
| **Services: orderService & paymentService**| `CREATE` | Implementar camada de serviço para disparo da transação segura `finalize_sale`. |
| **Services: cashRegisterService** | `CREATE` | Serviços de abertura, sangria, suprimento e fechamento de caixa. |
| **Mocks: constants.ts** | `REMOVE` | Eliminar gradualmente conforme as telas forem conectadas ao banco real. Manter apenas fixtures auxiliares de testes. |

---

## 7. Decisão de Arquitetura

### 7.1 Arquitetura Tailwind Aprovada
- **Pacotes:** `tailwindcss@3.4.17` + `postcss@8.4.49` + `autoprefixer@10.4.20` + `@tailwindcss/forms` + `@tailwindcss/container-queries`.
- **Justificativa:** Compatibilidade estrita de 100% com o conjunto existente de classes e plugins utilitários em `NewOrder.tsx`, `Dashboard.tsx` e `CostAnalysis.tsx`, eliminando qualquer risco de quebra de layout durante a remoção da CDN.

### 7.2 Arquitetura de Integridade Transacional do PDV
- **Problema Atual:** O cliente web finalizava pedidos com `alert()`.
- **Decisão V2:** Todo pedido será processado pela procedure Postgres `finalize_sale(p_order_payload JSONB)`.
  - O frontend envia apenas IDs e quantidades/pesos.
  - O banco busca os preços oficiais na tabela `products`.
  - O banco valida se o caixa do operador está aberto.
  - O banco insere `orders`, `order_items`, `order_payments`.
  - O banco abate o estoque automaticamente via triggers ou registros em `inventory_movements`.
  - Em caso de qualquer inconsistência, toda a operação sofre `ROLLBACK` atômico.

### 7.3 Arquitetura de Balança Comercial
- Criação da interface padronizada `ScaleAdapter`:
  ```ts
  interface ScaleAdapter {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    readWeight(): Promise<{ grossWeight: number; isStable: boolean }>;
  }
  ```
- No modo manual (sem balança física conectada), o operador digita o peso bruto, o sistema desconta a tara pré-selecionada do recipiente e grava um log de auditoria operacional.

---

## 8. Plano de Execução por Sprints

### Ordem e Entregas:
1. **SPRINT 0 (Concluído):** Auditoria física, baseline Git, mapeamento Tailwind e matriz KEEP/REFACTOR/REPLACE.
2. **SPRINT 1 (Segurança & Banco):** Migrations incrementais para suportar tipos de venda, recipientes, caixas; RLS e policies; correção de `search_path` e `security_invoker`.
3. **SPRINT 2 (Fundação Frontend):** Instalação nativa do Tailwind, correção de `index.css` e `tsconfig.json`, eliminação da CDN e code splitting no Vite.
4. **SPRINT 3 (PDV Touch Core):** Interface Touchscreen, venda por bola com múltiplos sabores, adicionais configuráveis, carrinho permanente.
5. **SPRINT 4 (Venda por Quilo & Balança):** Fluxo de pesagem por quilo, taras automáticas por recipiente, driver `ScaleAdapter` com fallback auditado.
6. **SPRINT 5 (Transação & Caixa):** Procedure `finalize_sale`, split de pagamentos (PIX, Cartão, Dinheiro), abertura/sangria/fechamento de caixa.
7. **SPRINT 6 (Estoque & Produção):** Conexão das telas de estoque e ingredientes com movimentações reais; gestão de cubas e lotes.
8. **SPRINT 7 (Gestão & Inteligência):** Dashboard e relatórios conectados aos dados reais de vendas e custos; clientes e fidelidade.
9. **SPRINT 8 (Hardening & Go-Live):** Testes automatizados de segurança, auditoria de tentativa de fraude de preço, PWA e build de produção final.

---

> **Critério de Saída do Sprint 0:** SPRINT 0 VALIDADO. Nenhuma feature ou modificação destrutiva foi aplicada precocemente. O sistema está pronto para a execução planejada do **Sprint 1 (Segurança & Banco Supabase)**.
