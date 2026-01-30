
## Correção: Botão "Mover" deve exigir APENAS assinatura (sem pagamento)

### Problema Identificado

No `ClientDetailSheet.tsx`, a função `handleMoveToLegalFunnel` (linhas 650-722) atualmente valida **duas condições**:

1. ✅ Contrato assinado (`signature_status = 'signed'`)
2. ❌ Pagamento confirmado (`status = 'paid'`) → **DEVE SER REMOVIDO**

Código atual (linhas 675-683):
```typescript
if (!hasSignedContract) {
  toast.error('Cliente precisa ter um contrato assinado para ser movido ao funil jurídico');
  return;
}

if (!hasPaidInvoice) {
  toast.error('Cliente precisa ter um pagamento confirmado para ser movido ao funil jurídico');
  return;  // ← ESTA VALIDAÇÃO SERÁ REMOVIDA
}
```

### Solicitação do Usuário

> "ASSINOU AUTOMATICAMENTE VIRA CLIENTE SEM PRECISAR CONFIRMAR PAGAMENTO"
> "Contrato está ASSINADO, NAO PRECISA ESTAR PAGO APENAS ASSINADO CONTRATO"

### Solução Proposta

#### Arquivo: `src/components/admin/clients/ClientDetailSheet.tsx`

**Remover a validação de pagamento** - manter apenas verificação de assinatura:

```typescript
const handleMoveToLegalFunnel = async () => {
  if (!client) return;

  try {
    // Check if client has a signed contract
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, signature_status')
      .eq('user_id', client.id)
      .eq('signature_status', 'signed')
      .limit(1);

    const hasSignedContract = contracts && contracts.length > 0;

    // VALIDAÇÃO ÚNICA: apenas contrato assinado
    if (!hasSignedContract) {
      toast.error('Cliente precisa ter um contrato assinado para ser movido ao funil jurídico');
      return;
    }

    // REMOVIDO: verificação de pagamento
    // O cliente pode ser movido apenas com contrato assinado

    // Move client to legal funnel
    // ... resto do código permanece igual
  }
};
```

**Atualizar mensagem do log:**
```typescript
description: 'Cliente movido do funil Comercial para Jurídico após assinatura do contrato.'
```

---

### Análise de Impacto

| Aspecto | Status |
|---------|--------|
| Banco de dados | ✅ Nenhuma alteração |
| Tabelas existentes | ✅ Preservadas |
| Funil jurídico | ✅ Sem alteração na estrutura |
| Funil comercial | ✅ Sem alteração na estrutura |
| Contratos antigos | ✅ Sem impacto |
| APIs/Integrações | ✅ Sem impacto |
| Área do cliente | ✅ Sem impacto |

---

### Teste Esperado

1. **Criar contrato** via Admin → Contratos → Novo Contrato
2. **Cliente assina o contrato**
3. Ir em **Clientes** → **Comercial**
4. Abrir detalhes do cliente → Clicar **"Mover"**
5. ✅ Cliente deve ser movido para **Jurídico** na etapa **PROTOCOLADO**
6. ❌ **SEM exigir pagamento confirmado**
