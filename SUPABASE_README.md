# 🍦 Sorveteria Gelato Manager - Integração Supabase

## 🚀 Setup Rápido

### 1. Executar Schema no Supabase

1. Acesse seu projeto Supabase: https://odcqfmkmfasptnqzypcl.supabase.co
2. Vá em **SQL Editor**
3. Copie e cole o conteúdo do arquivo `schema.sql`
4. Clique em **Run** para executar

### 2. Popular com Dados de Exemplo

1. No **SQL Editor** do Supabase
2. Copie e cole o conteúdo do arquivo `seed.sql`
3. Clique em **Run** para executar

### 3. Rodar a Aplicação

```bash
npm run dev
```

## 📁 Estrutura de Arquivos Criados

```
├── lib/
│   ├── supabase.ts          # Cliente Supabase
│   └── database.types.ts    # Tipos do banco
├── services/
│   ├── productService.ts    # CRUD de produtos
│   ├── ingredientService.ts # CRUD de ingredientes
│   ├── recipeService.ts     # CRUD de receitas
│   └── settingsService.ts   # Gerenciamento de configurações
├── hooks/
│   ├── useProducts.ts       # Hook de produtos
│   ├── useIngredients.ts    # Hook de ingredientes
│   └── useRecipes.ts        # Hook de receitas
├── schema.sql               # Schema do banco
└── seed.sql                 # Dados de exemplo
```

## ✅ Funcionalidades

- ✅ **Produtos**: Listagem com custo e margem calculados automaticamente
- ✅ **Ingredientes**: Controle de estoque e fornecedores
- ✅ **Receitas**: Fichas técnicas com cálculo automático de custos
- ✅ **Views**: Produtos com custo, ingredientes em baixo estoque
- ✅ **Triggers**: Atualização automática de custos e estoque  
- ✅ **Funções**: Cálculo de custo e margem de produtos

## 🔄 Próximos Passos

1. Execute os scripts SQL no Supabase
2. Teste a aplicação com `npm run dev`
3. Verifique se os dados aparecem corretamente
4. Comece a usar as funcionalidades CRUD

## 📝 Notas

- A aplicação usa o hook pattern para gerenciamento de estado
- Todos os serviços incluem tratamento de erro
- Loading states incluídos em todos os componentes
- As views do banco facilitam queries complexas
- Triggers garantem consistência automática dos dados
