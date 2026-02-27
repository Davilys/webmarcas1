
# Corrigir Contrato "Plano de Monitoramento e Manutencao" - Link de Assinatura + Cobranca Automatica

## Problemas Identificados

1. **Link de assinatura nao gerado**: O template "Plano de Monitoramento e Manutencao - Pos Certificado" nao contem "registro de marca" nem "padrao" no nome, entao o sistema pula a geracao automatica do link de assinatura.

2. **Fatura nao gerada no Asaas**: Nenhuma cobranca e criada porque o fluxo atual so gera cobranças apos a assinatura do contrato, e apenas para templates "padrao".

3. **Nao deve ter selecao de pagamento**: Este template deve gerar automaticamente um boleto recorrente (R$ 59,00/mes) direto no Asaas, sem exibir opcoes de pagamento ao admin.

## Solucao

### 1. Ajustar `CreateContractDialog.tsx` - Deteccao do template de monitoramento

Adicionar uma flag `isMonitoramentoTemplate` que detecta o template pelo nome (contendo "monitoramento" ou "manutencao"). Com isso:

- **Gerar link de assinatura automaticamente** (igual aos templates padrao)
- **Mostrar botao "Criar e Enviar Link"** para este template
- **Esconder a selecao de forma de pagamento** (PIX/Cartao/Boleto) pois a cobranca sera automatica via boleto recorrente
- **Definir valor do contrato como R$ 59,00** (primeira mensalidade) e payment_method como "boleto_recorrente"
- **Preencher automaticamente as variaveis do template** com os dados do cliente selecionado

### 2. Criar Edge Function `create-monitoring-subscription`

Nova Edge Function que:
- Recebe o `contractId` apos assinatura do contrato
- Busca os dados do cliente (perfil + contrato)
- Cria ou busca o cliente no Asaas
- Cria uma **assinatura recorrente** (subscription) no Asaas com:
  - Valor: R$ 59,00/mes
  - Ciclo: MONTHLY
  - Descricao: "Plano de Monitoramento e Manutencao - [nome da marca]"
- Cria a primeira fatura interna na tabela `invoices`
- A anuidade de R$ 398,00 em dezembro sera tratada como cobranca avulsa programada

### 3. Integrar chamada pos-assinatura

No fluxo de assinatura de contrato (`sign-contract-blockchain`), apos detectar que o contrato assinado e do tipo "monitoramento", chamar automaticamente a nova Edge Function para criar a assinatura recorrente no Asaas.

## Detalhes Tecnicos

### Arquivo: `src/components/admin/contracts/CreateContractDialog.tsx`

Alteracoes:
- Adicionar constante `isMonitoramentoTemplate` baseada no nome do template selecionado
- Incluir `isMonitoramentoTemplate` nas condicoes de `isStandardContractTemplate` para geracao de link
- Incluir `isMonitoramentoTemplate` em `showSendLinkButton`
- Quando `isMonitoramentoTemplate` = true, nao exibir o bloco de selecao de pagamento (linhas 2217-2339)
- Definir `contract_value` = 59.00 e `payment_method` = "boleto_recorrente" automaticamente
- Substituir variaveis do template (`{{nome_cliente}}`, `{{cpf_cnpj}}`, `{{endereco_cliente}}`, `{{marca}}`, `{{dia_vencimento}}`, `{{data_assinatura}}`, `{{email}}`, `{{telefone}}`) com dados do perfil

### Arquivo: `supabase/functions/create-monitoring-subscription/index.ts` (novo)

- Cria assinatura recorrente via API Asaas (`POST /v3/subscriptions`)
- Parametros: customer, billingType: BOLETO, value: 59.00, cycle: MONTHLY, nextDueDate: proximo mes
- Cria registro na tabela `invoices` com status 'pending'
- Registra o `asaas_invoice_id` no contrato

### Arquivo: `supabase/functions/sign-contract-blockchain/index.ts`

- Apos assinatura bem-sucedida, verificar se o contrato tem `payment_method = 'boleto_recorrente'`
- Se sim, invocar `create-monitoring-subscription` automaticamente

### Arquivo: `supabase/config.toml`

- Adicionar configuracao `verify_jwt = false` para a nova funcao

## Impacto

- Nenhum contrato existente sera alterado
- Nenhuma tabela sera modificada estruturalmente
- Apenas adicao de nova Edge Function e ajustes no dialogo de criacao
- O fluxo de pagamento dos templates existentes permanece inalterado
