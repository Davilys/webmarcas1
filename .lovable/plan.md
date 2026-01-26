
# Plano: Corrigir Integração Asaas na Criação de Contratos pelo Admin

## Problema Identificado

A integração com o Asaas **não funciona corretamente** quando o admin cria contratos para **clientes existentes** (não para novos clientes).

### Causa Raiz

Na criação de contrato (`CreateContractDialog.tsx`, linha 485):

```typescript
payment_method: isNewClient ? paymentMethod : null,
```

O `payment_method` **só é salvo quando o admin cria um novo cliente** (`isNewClient = true`).

Para clientes existentes, o campo fica `null`, e na página de assinatura (`AssinarDocumento.tsx`, linha 249):

```typescript
if (contract.payment_method) {
  await createPaymentAfterSignature();
}
```

Como `payment_method` é `null`, o pagamento **nunca é criado** após a assinatura!

### Evidência no Banco de Dados

| Contrato | payment_method | Problema |
|----------|---------------|----------|
| TESTE 4 | `null` | Assinado, sem pagamento |
| TESTE 3 | `null` | Sem pagamento |
| CONTRTAO DE REGISTRO... | `null` | Assinado, sem pagamento |
| CONTRATO (18:10) | `cartao6x` | Funcionando (novo cliente) |
| CONTRATO (18:10) | `avista` | Funcionando (novo cliente) |

---

## Solução Proposta

### 1. Adicionar Seleção de Forma de Pagamento para Clientes Existentes

**Arquivo**: `src/components/admin/contracts/CreateContractDialog.tsx`

Quando o admin seleciona um **cliente existente** com template de contrato padrão (Registro de Marca), deve aparecer a opção de escolher a forma de pagamento.

#### Alterações:

**a) Adicionar estado para controle de pagamento no fluxo existente:**

Atualmente, `paymentMethod` só é usado no fluxo de novo cliente. Precisamos usá-lo também para clientes existentes quando o template é o contrato padrão.

**b) Modificar a lógica de salvamento do contrato (linha 485):**

De:
```typescript
payment_method: isNewClient ? paymentMethod : null,
```

Para:
```typescript
payment_method: (isNewClient || isStandardContractTemplate) ? paymentMethod : null,
```

**c) Adicionar UI de seleção de pagamento para clientes existentes:**

No formulário de cliente existente (após linha 1140), quando o template selecionado é "Registro de Marca" ou "Padrão", exibir as opções de pagamento (PIX, Cartão 6x, Boleto 3x).

### 2. Atualizar Valor do Contrato Baseado no Método de Pagamento

Atualmente, o campo `contract_value` é manual. Para clientes existentes com template padrão, o valor deve ser calculado automaticamente baseado no `paymentMethod`:

| Método | Valor |
|--------|-------|
| avista | R$ 699 |
| cartao6x | R$ 1.194 |
| boleto3x | R$ 1.197 |

---

## Detalhamento Técnico

### Alterações no `CreateContractDialog.tsx`

#### 1. Identificar template padrão fora do bloco de submit

Mover a verificação `isStandardContractTemplate` para o início do componente:

```typescript
const isStandardContractTemplate = selectedTemplate?.name.toLowerCase().includes('registro de marca') ||
                                    selectedTemplate?.name.toLowerCase().includes('padrão');
```

#### 2. Adicionar seção de pagamento no formulário de cliente existente

Entre as tabs "Informações Básicas" e o botão de submit, quando `isStandardContractTemplate` é `true`, exibir as mesmas opções de pagamento do fluxo de novo cliente.

```typescript
{/* Payment selection for standard contracts with existing clients */}
{!isNewClient && isStandardContractTemplate && (
  <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-lg border">
    <Label className="font-medium">Forma de Pagamento *</Label>
    <p className="text-sm text-muted-foreground">
      Selecione a forma de pagamento para este contrato.
    </p>
    {/* Reutilizar os mesmos cards de pagamento */}
    ...
  </div>
)}
```

#### 3. Atualizar lógica de valor do contrato

Quando `isStandardContractTemplate` é `true`, sobrescrever o valor manual pelo valor calculado:

```typescript
contract_value: isNewClient 
  ? getContractValue() 
  : (isStandardContractTemplate ? getContractValue() : parseFloat(formData.contract_value)),
```

#### 4. Atualizar salvamento do payment_method

```typescript
payment_method: (isNewClient || isStandardContractTemplate) ? paymentMethod : null,
```

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Admin cria contrato para **novo cliente** | payment_method salvo ✅ | payment_method salvo ✅ |
| Admin cria contrato para **cliente existente** com template padrão | payment_method `null` ❌ | payment_method salvo ✅ |
| Admin cria contrato para cliente existente com template personalizado | payment_method `null` | payment_method `null` (comportamento mantido) |
| Após assinatura | Pagamento criado apenas para novos clientes | Pagamento criado para todos com template padrão |

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/contracts/CreateContractDialog.tsx` | Adicionar seleção de pagamento para clientes existentes + corrigir lógica de salvamento |

---

## Validação Pós-Implementação

1. Criar contrato para cliente **existente** usando template padrão
2. Verificar no banco se `payment_method` foi salvo
3. Assinar o contrato
4. Verificar se a cobrança Asaas foi criada automaticamente
