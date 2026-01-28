
# Plano: Remover Pré-Seleção de Forma de Pagamento

## Problema
Na aba "Contratos" do CRM, ao criar um novo documento, a opção "PIX à Vista - R$ 699,00" vem **pré-selecionada por padrão**. O usuário precisa que a seleção seja **opcional** - documentos que não requerem cobrança não devem ter forma de pagamento selecionada.

## Causa Raiz
No arquivo `CreateContractDialog.tsx`:
- **Linha 132**: `paymentMethod` é inicializado com `'avista'`
- **Linha 766**: No reset do formulário, volta para `'avista'`
- **Linha 584**: O valor é sempre salvo no banco, mesmo quando não desejado

## Solução Proposta

### 1. Alterar o Tipo e Valor Inicial de `paymentMethod`
**Antes:**
```typescript
const [paymentMethod, setPaymentMethod] = useState<'avista' | 'cartao6x' | 'boleto3x'>('avista');
```

**Depois:**
```typescript
const [paymentMethod, setPaymentMethod] = useState<'avista' | 'cartao6x' | 'boleto3x' | null>(null);
```

### 2. Atualizar a Função `resetForm()`
**Antes:**
```typescript
setPaymentMethod('avista');
```

**Depois:**
```typescript
setPaymentMethod(null);
```

### 3. Atualizar a Lógica de Salvamento no Banco
**Antes (linha 584):**
```typescript
payment_method: (isNewClient || isStandardTemplate) ? paymentMethod : null,
```

**Depois:**
```typescript
payment_method: (isNewClient || isStandardTemplate) && paymentMethod ? paymentMethod : null,
```

### 4. Atualizar a UI para Mostrar "Nenhum Selecionado"
Ajustar o texto de "Forma selecionada:" para mostrar quando nenhuma opção está selecionada:

**Antes:**
```typescript
<strong>Forma selecionada:</strong> {getPaymentDescription()}
```

**Depois:**
```typescript
<strong>Forma selecionada:</strong> {paymentMethod ? getPaymentDescription() : 'Nenhuma (sem cobrança)'}
```

### 5. Atualizar `getPaymentDescription()` e `getContractValue()`
Adicionar tratamento para `null`:

```typescript
const getContractValue = () => {
  if (!paymentMethod) return null;
  switch (paymentMethod) {
    case 'avista': return 699;
    case 'cartao6x': return 1194;
    case 'boleto3x': return 1197;
    default: return null;
  }
};

const getPaymentDescription = () => {
  if (!paymentMethod) return 'Nenhuma forma selecionada';
  switch (paymentMethod) {
    // ... existing cases
  }
};
```

---

## Análise de Risco

| Risco | Mitigação |
|-------|-----------|
| Quebrar fluxo de novo cliente | O fluxo de novo cliente requer pagamento; validar que `paymentMethod` é obrigatório para `isNewClient` |
| Valor do contrato como `null` | Permitido - contratos sem cobrança terão `contract_value: null` |
| Edge Function de pagamento | Só é chamada se `payment_method` estiver definido no banco |

---

## Comportamento Esperado

### Cenário 1: Documento SEM cobrança
1. Admin seleciona cliente e modelo "Procuração INPI"
2. **Nenhuma forma de pagamento selecionada** (campo não aparece para procuração)
3. Documento criado sem `payment_method` → **sem cobrança Asaas**

### Cenário 2: Documento COM cobrança (Registro de Marca)
1. Admin seleciona cliente e modelo "Contrato Registro de Marca"
2. **Forma de Pagamento aparece SEM seleção padrão**
3. Admin clica em "PIX à Vista"
4. Documento criado com `payment_method: 'avista'` → **cobrança Asaas gerada**

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/contracts/CreateContractDialog.tsx` | Tipo de estado, valor inicial, reset, lógica de salvamento, UI |

---

## Estimativa

- **Complexidade**: Baixa
- **Linhas modificadas**: ~10
- **Risco de regressão**: Baixo (alteração isolada no estado de seleção)
