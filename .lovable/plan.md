
# Correcao: Notificacao "Pagamento Recebido" enviada antes do pagamento

## Problema

A Edge Function `confirm-payment` dispara o email `payment_received` (linha 266) assim que o cliente conclui o formulario de checkout. Nesse momento o cliente **ainda nao pagou** - ele apenas assinou o contrato e escolheu a forma de pagamento. O email de "Pagamento confirmado! Seu processo esta em andamento" e enviado prematuramente.

O webhook do Asaas (`asaas-webhook/index.ts`) **ja dispara** `payment_received` corretamente quando o pagamento e de fato confirmado (status RECEIVED/CONFIRMED). Portanto o disparo em `confirm-payment` e duplicado e prematuro.

## Solucao

### Arquivo: `supabase/functions/confirm-payment/index.ts`

**Remover** o bloco de disparo do `payment_received` (linhas 262-286). Este bloco:

```
// STEP 4.1: Trigger payment_received email automation
try {
  await fetch(...trigger-email-automation..., {
    body: JSON.stringify({
      trigger_event: 'payment_received',
      ...
    }),
  });
} catch (emailError) { ... }
```

Sera **removido por completo**. O disparo de `contract_signed` (linhas 234-259) continua, pois esse evento de fato ocorre nesse momento.

### Nenhum outro arquivo alterado

- `asaas-webhook/index.ts` ja dispara `payment_received` corretamente quando o Asaas confirma o pagamento
- O template "Pagamento Recebido" nos E-mails Automaticos continua funcionando normalmente
- Nenhuma alteracao no frontend

## Resultado

- Ao assinar e concluir: envia apenas `contract_signed` (correto)
- Ao Asaas confirmar pagamento via webhook: envia `payment_received` (correto)
- Nenhum email prematuro de "Pagamento confirmado"
