# ✅ Checklist - Integração Supabase

## 1. Executar Schema no Supabase ⚠️

**PRIMEIRO PASSO OBRIGATÓRIO:**
1. Acesse: https://odcqfmkmfasptnqzypcl.supabase.co
2. Vá em **SQL Editor** (menu lateral esquerdo)
3. Clique em **New Query**
4. Copie TODO o conteúdo de `schema.sql`
5. Cole no editor
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde completar ✅

## 2. Popular com Dados (Seed) ⚠️

**SEGUNDO PASSO OBRIGATÓRIO:**
1. No mesmo **SQL Editor** do Supabase
2. Clique em **New Query**
3. Copie TODO o conteúdo de `seed.sql` (versão corrigida)
4. Cole no editor
5. Clique em **Run**
6. Você deve ver: `"Seed data inserido com sucesso! Total: 10 produtos, 19 ingredientes, 6 receitas"` ✅

## 3. Verificar Dados no Supabase

1. No Supabase, vá em **Table Editor**
2. Verifique se as tabelas foram criadas:
   - ✅ `products` - deve ter 10 linhas
   - ✅ `ingredients` - deve ter 19 linhas
   - ✅ `recipes` - deve ter 6 linhas
   - ✅ `recipe_items` - deve ter ~30 linhas

## 4. Rodar Frontend

```bash
npm run dev
```

Abra: http://localhost:5173

## 5. Verificar Conexão

**No Browser (F12 - Console):**
- ✅ Não deve ter erros de CORS
- ✅ Não deve ter erros 401/403 (auth)
- ✅ Você deve ver requests para `supabase.co`

**Na página Products:**
- ✅ Deve mostrar "Carregando produtos..." por ~1 segundo
- ✅ Depois deve listar os 10 produtos
- ✅ Custo e margem devem aparecer calculados

**Na página Receitas:**
- ✅ Deve listar 6 receitas
- ✅ Mostra custo total calculado
- ✅ Pode expandir para ver ingredientes

## Troubleshooting

### ❌ Erro: "Missing Supabase environment variables"
**Solução:** Verifique se `.env` existe com:
```env
VITE_SUPABASE_URL=https://odcqfmkmfasptnqzypcl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

### ❌ Produtos aparecem mas sem custo/margem
**Solução:** Execute `seed.sql` novamente no Supabase

### ❌ Erro 404 nas requests
**Solução:** Verifique se `schema.sql` foi executado corretamente

### ❌ Erro "relation does not exist"
**Solução:** Execute `schema.sql` primeiro, depois `seed.sql`

### ❌ Tela em branco / loading infinito
**Solução:** 
1. Abra Console (F12)
2. Veja o erro exato
3. Verifique se URL e KEY do Supabase estão corretos

## Status Atual - VOCÊ PRECISA:

1. ⚠️ **Executar `schema.sql` no Supabase** (se ainda não executou)
2. ⚠️ **Executar `seed.sql` no Supabase** (se ainda não executou)
3. ⚠️ **Reiniciar `npm run dev`** (pare com Ctrl+C e rode novamente)
4. ✅ Abrir http://localhost:5173
5. ✅ Ver dados do Supabase carregando!

---

**IMPORTANTE:** O frontend JÁ ESTÁ configurado para usar Supabase!
- Products.tsx ✅ Usa `useProducts()`
- Recipes.tsx ✅ Usa `useRecipes()`

Você SÓ precisa executar os SQLs no Supabase!
