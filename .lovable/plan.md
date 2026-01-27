

# Plano: Correção Completa do Fluxo de Pagamento por Cartão de Crédito

## Problemas Identificados

### 1. IDs Ausentes (Risco Alto)
- `invoiceId` e `customerId` podem estar vazios quando passados ao `CreditCardForm`
- Causa erro "Dados de pagamento incompletos"

### 2. Preços Hardcoded no Backend (Risco Médio)
- Edge Function usa valores fixos (`1194`, `199`) em vez de buscar do `system_settings`
- Pode causar divergência entre frontend e backend

### 3. Validação de CEP Inexistente (Risco Médio)
- CEP não é validado antes de enviar ao Asaas
- Causa rejeição com `invalid_creditCardHolderInfo`

### 4. Número do Endereço Hardcoded (Risco Baixo)
- Sempre envia `addressNumber: 'S/N'`
- Alguns gateways podem rejeitar

---

## Solução Proposta

### Etapa 1: Garantir IDs no StatusPedido.tsx

**Arquivo:** `src/pages/cliente/StatusPedido.tsx`

Adicionar validação antes de renderizar o `CreditCardForm`:

```tsx
// Verificar se os IDs necessários estão presentes
const hasValidPaymentData = useMemo(() => {
  const customerId = orderData?.asaas?.asaasCustomerId || orderData?.asaas?.customerId;
  const invoiceId = orderData?.invoiceId;
  return Boolean(customerId && invoiceId);
}, [orderData]);

// No render, mostrar erro claro se faltar dados
{!hasValidPaymentData && paymentMethod === 'cartao6x' && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Dados de pagamento incompletos. Por favor, reinicie o processo de cadastro.
      <Button variant="link" onClick={() => navigate('/registrar')}>
        Reiniciar
      </Button>
    </AlertDescription>
  </Alert>
)}
```

### Etapa 2: Sincronizar Pricing no Backend

**Arquivo:** `supabase/functions/create-post-signature-payment/index.ts`

Buscar preços dinamicamente do `system_settings`:

```typescript
// Buscar configuração de preços do banco
const { data: pricingData } = await supabaseClient
  .from('system_settings')
  .select('value')
  .eq('key', 'pricing')
  .maybeSingle();

// Usar valores dinâmicos ou fallback para defaults
const pricing = pricingData?.value || {
  basePrice: 699,
  cardInstallments: 6,
  cardInstallmentValue: 199,
  boletoInstallments: 3,
  boletoInstallmentValue: 398
};

// Calcular valores baseados no método de pagamento
let totalValue: number;
let installmentCount: number;
let installmentValue: number;

if (paymentMethod === 'cartao6x') {
  installmentCount = pricing.cardInstallments || 6;
  installmentValue = pricing.cardInstallmentValue || 199;
  totalValue = installmentCount * installmentValue;
} else if (paymentMethod === 'boleto3x') {
  installmentCount = pricing.boletoInstallments || 3;
  installmentValue = pricing.boletoInstallmentValue || 398;
  totalValue = installmentCount * installmentValue;
} else {
  totalValue = pricing.basePrice || 699;
  installmentCount = 1;
  installmentValue = totalValue;
}
```

### Etapa 3: Validação de CEP Obrigatório

**Arquivo:** `src/components/cliente/checkout/PersonalDataStep.tsx`

Adicionar validação rigorosa do CEP:

```tsx
// Schema de validação com Zod
const personalDataSchema = z.object({
  // ... outros campos
  cep: z.string()
    .min(8, 'CEP deve ter 8 dígitos')
    .max(9, 'CEP inválido')
    .regex(/^\d{5}-?\d{3}$/, 'Formato de CEP inválido'),
  addressNumber: z.string()
    .min(1, 'Número do endereço é obrigatório')
    .default('S/N'),
});

// Validar antes de avançar
const handleNext = async () => {
  const cleanCep = formData.cep?.replace(/\D/g, '');
  if (!cleanCep || cleanCep.length !== 8) {
    toast.error('Por favor, informe um CEP válido');
    return;
  }
  // ... continuar
};
```

### Etapa 4: Capturar Número do Endereço

**Arquivo:** `src/components/cliente/checkout/PersonalDataStep.tsx`

Adicionar campo para número do endereço:

```tsx
<div className="grid grid-cols-3 gap-4">
  <div className="col-span-2">
    <Label>Endereço</Label>
    <Input
      value={formData.address}
      onChange={(e) => updateFormData('address', e.target.value)}
      placeholder="Rua, Avenida..."
    />
  </div>
  <div>
    <Label>Número</Label>
    <Input
      value={formData.addressNumber}
      onChange={(e) => updateFormData('addressNumber', e.target.value)}
      placeholder="Nº"
    />
  </div>
</div>
```

**Arquivo:** `src/components/payment/CreditCardForm.tsx`

Usar o número capturado em vez de hardcoded:

```tsx
creditCardHolderInfo: {
  // ...
  addressNumber: holderAddressNumber || 'S/N', // Usar prop em vez de hardcoded
}
```

### Etapa 5: Melhorar Logs no Backend

**Arquivo:** `supabase/functions/process-credit-card-payment/index.ts`

Adicionar logs estruturados:

```typescript
console.log("=== CREDIT CARD PAYMENT START ===");
console.log("Invoice ID:", invoiceId);
console.log("Customer ID:", customerId);
console.log("Value:", value);
console.log("Installments:", installmentCount, "x", installmentValue);

// Após resposta do Asaas
console.log("=== ASAAS RESPONSE ===");
console.log("Status:", paymentData.status);
console.log("Payment ID:", paymentData.id);
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/cliente/StatusPedido.tsx` | Validação de IDs antes de renderizar formulário |
| `src/components/cliente/checkout/PersonalDataStep.tsx` | Campo de número + validação CEP |
| `src/components/payment/CreditCardForm.tsx` | Aceitar prop `addressNumber` |
| `supabase/functions/create-post-signature-payment/index.ts` | Buscar pricing dinâmico |
| `supabase/functions/process-credit-card-payment/index.ts` | Logs estruturados |

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| IDs ausentes | Erro genérico ou spinner infinito | Mensagem clara + botão reiniciar |
| Preço alterado no admin | Backend usa valor antigo | Backend sincronizado |
| CEP inválido | Erro do Asaas | Validação no frontend |
| Sem número endereço | Sempre "S/N" | Campo opcional preenchido |
| Debug de erros | Sem logs | Logs estruturados |

---

## Prioridade de Implementação

1. **Alta:** Validação de IDs (StatusPedido) - impede erros críticos
2. **Alta:** Validação de CEP - causa mais rejeições
3. **Média:** Pricing dinâmico - evita divergências
4. **Baixa:** Número do endereço - melhoria incremental
5. **Baixa:** Logs - facilita debug futuro

