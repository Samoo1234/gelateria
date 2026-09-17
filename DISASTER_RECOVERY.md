# DISASTER RECOVERY & PROCEDIMENTOS DE CONTINUIDADE OPERACIONAL
## Gelato Manager V2 — Produção & Resiliência

---

## 1. Visão Geral da Arquitetura de Dados
O Gelato Manager V2 utiliza o **Supabase / PostgreSQL 17 (AWS us-east-1)** como fonte única e central da verdade, protegido por:
- **Transações Atômicas**: Operações críticas de PDV (`finalize_sale`), cancelamento (`cancel_sale`), conciliação de estoque de cubas (`reconcile_tub`) e produção em fábrica (`complete_production_batch`) são ACID-compliant (tudo ou nada).
- **Row Level Security (RLS)** habilitado com políticas por papel funcional (Admin, Manager, Cashier, Stock, Production).
- **Idempotência (Anti-Double Submit)**: Todas as vendas contêm chave `idempotency_key` evitando duplicidade de ordens e lançamentos em cenários de retry de rede ou duplo clique no touchscreen.
- **Trilha de Auditoria Imutável (`audit_logs`)**: Eventos sensíveis de caixa, estoque e cancelamento são registrados sem possibilidade de deleção pelo operador.

---

## 2. Estratégia de Backup do Banco de Dados

### 2.1 Backups Automatizados da Infraestrutura (Supabase / AWS)
- **Point-In-Time Recovery (PITR)**: Snapshots contínuos de WAL (Write-Ahead Logs) retidos conforme plano, possibilitando restauração para qualquer minuto/segundo.
- **Backups Físicos Diários**: Realizados automaticamente pelo provedor em múltiplas zonas de disponibilidade (Multi-AZ).

### 2.2 Backup Lógico Manual / Agendado (pg_dump)
Para rotinas periódicas de contingência e retenção local:
```bash
# Exportação do schema e dados (excluindo dados temporários)
pg_dump -h db.odcqfmkmfasptnqzypcl.supabase.co -U postgres -d postgres -F c -b -v -f gelato_backup_$(date +%Y%m%d_%H%M%S).dump

# Exportação apenas do Schema
pg_dump -h db.odcqfmkmfasptnqzypcl.supabase.co -U postgres -d postgres --schema-only -f gelato_schema_$(date +%Y%m%d).sql
```

---

## 3. Procedimento de Restauração (Restore)

### 3.1 Restauração em Caso de Corrupção Lógica ou Incidente
> ⚠️ **ATENÇÃO:** NUNCA execute restore destrutivo em banco de produção sem antes gerar um snapshot de segurança do estado corrente.

1. **Isolar o tráfego do PDV**: Colocar a aplicação em modo de manutenção ou desconectar terminais.
2. **Avaliar ponto de restauração**: Identificar o timestamp exato anterior ao incidente através dos logs de auditoria (`audit_logs`).
3. **Execução do Restore via CLI / Supabase Console**:
   - Acessar o painel do Supabase > Settings > Database > Backups.
   - Selecionar o PITR para o timestamp pré-incidente.
   - Confirmar o processo de rollback.
4. **Validação Pós-Restore**:
   - Executar suíte automatizada: `node tests/sprint9_automated_checks.mjs`.
   - Conferir consistência do último caixa aberto e última venda registrada.

---

## 4. Gestão de Variáveis de Ambiente & Segredos

O sistema requer as seguintes variáveis configuradas no ambiente do cliente (`.env` ou pipeline CI/CD):

| Variável | Descrição | Nível de Acesso |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Endpoint da API Supabase REST / RPC | Público (Client-safe) |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anônima sujeita a RLS | Público (Client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave administrativa com bypass de RLS | **ESTRITAMENTE PRIVADA (Servidor/CI)** |

---

## 5. Contingência Operacional em Loja (Queda de Internet / Terminal)

### Cenário A: Queda Temporária de Internet durante a Operação
1. O Gelato Manager V2 opera como PWA responsivo com feedback claro de conexão.
2. **Política Financeira**: Vendas fiscais/financeiras exigem integridade com o backend central para garantir numeração sequencial de pedidos, controle de caixa e validação de preços contra adulteração. O PDV exibe alerta de conectividade e bloqueia o botão de finalização até restabelecimento.
3. Graças à chave de **idempotência**, se uma venda for enviada mas a resposta HTTP falhar no retorno, o reenvio subsequente pelo operador **não duplicará** o pedido nem o valor no caixa, recuperando o pedido já registrado com status `is_replay: true`.

### Cenário B: Falha Física do Terminal de Caixa (Hardware)
1. O operador pode abrir o Gelato Manager V2 em qualquer outro terminal ou tablet reserva via navegador / PWA.
2. Efetuar login com as credenciais do operador.
3. Vincular-se ao terminal de caixa correspondente e retomar a operação instantaneamente. A sessão de caixa aberta permanece ativa no Supabase.

---

## 6. Contatos de Emergência & Escalação Técnica
- **Suporte Nível 1 (Balcão/Operador)**: Gerente de Loja / Encarregado de Turno.
- **Suporte Nível 2 (Infraestrutura/Banco)**: Administrador de Sistemas Gelato Manager.
- **Canal de Incidentes Críticos**: Equipe DevOps & SRE.
