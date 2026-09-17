# CHECKLIST DE FECHAMENTO DA LOJA & PDV
## Gelato Manager V2 — Rotina Operacional Noturna / Fim de Turno

Este checklist deve ser executado no encerramento das operações diárias pelo **Operador de Caixa** acompanhado pelo **Gerente de Loja**.

---

### [ ] 1. Finalização de Vendas em Andamento
- [ ] Nenhum cliente aguardando atendimento.
- [ ] Todos os pedidos abertos no PDV devidamente finalizados ou cancelados.
- [ ] Conferir se não há vendas pendentes ou pagamentos sem confirmação.

### [ ] 2. Reconciliação Física de Cubas & Registro de Perdas
- [ ] Realizar a aferição de peso das cubas que permanecerão na câmara fria / freezer de retenção.
- [ ] No sistema, acessar **Estoque > Cubas no Balcão** e acionar **⚖ Reconciliar Cuba**:
  - [ ] Informar o peso físico aferido na balança.
  - [ ] Verificar a diferença apurada pelo sistema (diferenças negativas são automaticamente convertidas em perdas de estoque com rastreabilidade).
- [ ] Registrar eventuais perdas operacionais do dia (ex: degelo, quebra de cascões, sobras descartadas).

### [ ] 3. Conferência & Fechamento de Caixa
- [ ] No PDV, acessar o menu **Operações de Caixa > Fechar Caixa**:
  - [ ] Contar o dinheiro físico (cédulas e moedas) na gaveta.
  - [ ] Inserir o valor físico conferido no formulário de fechamento.
  - [ ] O sistema calcula e exibe a diferença (sobra ou falta de caixa).
  - [ ] Adicionar justificativa obrigatória caso haja divergência de valores.
- [ ] Confirmar o fechamento de caixa:
  - [ ] O status da sessão é alterado para `CLOSED`.
  - [ ] O valor de sangria final para cofre/depósito é devidamente registrado.
  - [ ] Um evento imutável `CASH_CLOSE` é gerado na trilha de auditoria.

### [ ] 4. Limpeza & Conservação de Equipamentos
- [ ] Balança limpa e desligada / em modo de proteção.
- [ ] Impressora térmica desligada e sem resíduos de papel.
- [ ] Desligamento seguro dos terminais touch ou bloqueio de tela com logout de sessão.
- [ ] Vitrine de gelato limpa e fechada com as proteções térmicas noturnas.

---
**Operador de Caixa:** ________________________________________  
**Gerente Autorizador:** ________________________________________  
**Data / Hora:** _____/_____/_________ às _____:_____
