

## Plano de Correção: PDF Incorreto e Valor do Asaas para Múltiplas Marcas

### Resumo dos Problemas Identificados

#### Erro 1: PDF Baixado Diferente da Visualização
**Causa Raiz:** A função `generateDocumentPrintHTML` em `DocumentRenderer.tsx` não está recebendo o `logoBase64` quando chamada a partir da página de assinatura (`AssinarDocumento.tsx`). A chamada atual passa `undefined` para o parâmetro `logoBase64`, causando o uso de um SVG fallback genérico em vez da logo real.

**Prova no código:**
```typescript
// Em AssinarDocumento.tsx linha 285-300
const html = generateDocumentPrintHTML(
  (contract.document_type as any) || 'procuracao',
  contract.contract_html || '',
  contract.client_signature_image,
  blockchainSignature,
  signatoryName,
  signatoryCpf,
  signatoryCnpj,
  signatureBase64
  // FALTA: baseUrl
  // FALTA: logoBase64 ← ESTE É O PROBLEMA!
);
```

---

#### Erro 2: Valor Incorreto no Asaas para Múltiplas Marcas
**Causa Raiz:** A edge function `create-post-signature-payment` calcula o valor do pagamento localmente usando valores fixos (699, 1194, 1197) **sem considerar o `contract_value` salvo no banco de dados** que já contém o valor total calculado com múltiplas marcas.

**Prova no código:**
```typescript
// Em create-post-signature-payment/index.ts linhas 104-124
switch (paymentMethod) {
  case 'cartao6x':
    installmentValue = pricing.cardInstallmentValue || 199;  // FIXO: 199
    totalValue = installmentCount * installmentValue;        // FIXO: 1194
    break;
  case 'boleto3x':
    installmentValue = pricing.boletoInstallmentValue || 399; // FIXO: 399
    totalValue = installmentCount * installmentValue;         // FIXO: 1197
    break;
  // ...
}
// Ignora completamente contract.contract_value que já tem o total correto!
```

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/AssinarDocumento.tsx` | Corrigir chamada de `generateDocumentPrintHTML` para passar `logoBase64` |
| `supabase/functions/create-post-signature-payment/index.ts` | Usar `contract_value` do banco ao invés de recalcular |

---

### Detalhamento Técnico

#### Correção 1: PDF com Logo e Estrutura Corretos

**Problema:** A função `handleDownloadPDF` em `AssinarDocumento.tsx` não passa os parâmetros `baseUrl` e `logoBase64`.

**Solução:**

```typescript
// ANTES (linha 276-300 de AssinarDocumento.tsx)
const handleDownloadPDF = async () => {
  if (!contract) return;
  
  let signatureBase64: string | undefined;
  if (contract.document_type === 'procuracao') {
    signatureBase64 = await getSignatureBase64();
  }

  const html = generateDocumentPrintHTML(
    (contract.document_type as any) || 'procuracao',
    contract.contract_html || '',
    contract.client_signature_image,
    contract.blockchain_hash ? { ... } : undefined,
    contract.signatory_name || undefined,
    contract.signatory_cpf || undefined,
    contract.signatory_cnpj || undefined,
    signatureBase64
    // FALTAM: baseUrl e logoBase64!
  );
  // ...
};

// DEPOIS
const handleDownloadPDF = async () => {
  if (!contract) return;
  
  let signatureBase64: string | undefined;
  if (contract.document_type === 'procuracao') {
    signatureBase64 = await getSignatureBase64();
  }

  // CORREÇÃO: Carregar logo em base64 ANTES de gerar o HTML
  const logoBase64 = await getLogoBase64ForPDF();

  const html = generateDocumentPrintHTML(
    (contract.document_type as any) || 'procuracao',
    contract.contract_html || '',
    contract.client_signature_image,
    contract.blockchain_hash ? { ... } : undefined,
    contract.signatory_name || undefined,
    contract.signatory_cpf || undefined,
    contract.signatory_cnpj || undefined,
    signatureBase64,
    window.location.origin, // CORREÇÃO: Adicionar baseUrl
    logoBase64              // CORREÇÃO: Adicionar logoBase64
  );
  // ...
};
```

**Importação necessária:**
```typescript
// Adicionar import de getLogoBase64ForPDF
import { DocumentRenderer, generateDocumentPrintHTML, getSignatureBase64, getLogoBase64ForPDF } from '@/components/contracts/DocumentRenderer';
```

---

#### Correção 2: Valor do Asaas Usando contract_value do Banco

**Problema:** A edge function ignora o `contract_value` já salvo e recalcula usando valores unitários.

**Solução:**

```typescript
// ANTES (linhas 96-124 de create-post-signature-payment/index.ts)
const paymentMethod = contract.payment_method || 'avista';

let billingType: string;
let totalValue: number;
let installmentCount: number;
let installmentValue: number;

switch (paymentMethod) {
  case 'cartao6x':
    billingType = 'CREDIT_CARD';
    installmentCount = 6;
    installmentValue = 199;           // FIXO
    totalValue = 1194;                // FIXO = 6 * 199
    break;
  // ...
}

// DEPOIS - Usar contract_value do banco de dados
const paymentMethod = contract.payment_method || 'avista';

// CORREÇÃO: Usar o valor do contrato salvo no banco (já calculado com múltiplas marcas)
const savedContractValue = contract.contract_value;

let billingType: string;
let totalValue: number;
let installmentCount: number;
let installmentValue: number;

switch (paymentMethod) {
  case 'cartao6x':
    billingType = 'CREDIT_CARD';
    installmentCount = pricing.cardInstallments || 6;
    // CORREÇÃO: Se o contrato tem valor salvo, usar ele. Senão, fallback para cálculo padrão
    if (savedContractValue && savedContractValue > 0) {
      totalValue = savedContractValue;
      installmentValue = Math.round(totalValue / installmentCount * 100) / 100;
    } else {
      installmentValue = pricing.cardInstallmentValue || 199;
      totalValue = installmentCount * installmentValue;
    }
    break;
  case 'boleto3x':
    billingType = 'BOLETO';
    installmentCount = pricing.boletoInstallments || 3;
    // CORREÇÃO: Mesmo padrão - usar valor salvo se existir
    if (savedContractValue && savedContractValue > 0) {
      totalValue = savedContractValue;
      installmentValue = Math.round(totalValue / installmentCount * 100) / 100;
    } else {
      installmentValue = pricing.boletoInstallmentValue || 399;
      totalValue = installmentCount * installmentValue;
    }
    break;
  case 'avista':
  default:
    billingType = 'PIX';
    installmentCount = 1;
    // CORREÇÃO: Usar valor salvo se existir
    if (savedContractValue && savedContractValue > 0) {
      totalValue = savedContractValue;
    } else {
      totalValue = pricing.basePrice || 699;
    }
    installmentValue = totalValue;
    break;
}

console.log(`Contract saved value: ${savedContractValue}`);
console.log(`Calculated total: ${totalValue}, installments: ${installmentCount}x${installmentValue}`);
```

---

### Exemplo Prático

**Cenário:** Admin cria contrato com 2 marcas, pagamento boleto 3x.

| Etapa | Antes (Bug) | Depois (Corrigido) |
|-------|-------------|-------------------|
| 1. Admin cria contrato | `contract_value = 2394` (1197 × 2) | `contract_value = 2394` |
| 2. Cliente assina | - | - |
| 3. Edge function processa | Ignora 2394, calcula 1197 | Usa 2394 do banco |
| 4. Asaas recebe | 3x de R$ 399 = R$ 1.197 | 3x de R$ 798 = R$ 2.394 |

---

### Validação

Após implementar:

1. **Teste PDF:**
   - Criar contrato com múltiplas marcas
   - Gerar link de assinatura
   - Assinar contrato
   - Baixar PDF → Deve ter logo, gradient bar, estrutura idêntica à visualização

2. **Teste Asaas:**
   - Criar contrato com 2 marcas, boleto 3x
   - Assinar contrato
   - Verificar no Asaas: valor deve ser R$ 2.394,00 (3x R$ 798,00)

---

### Retrocompatibilidade

| Item | Impacto |
|------|---------|
| Contratos existentes com valor nulo | Fallback para cálculo padrão (1 marca) |
| Contratos antigos já assinados | Não afetados |
| Edge function | Retrocompatível (if/else com fallback) |
| PDF para 1 marca | Funciona normalmente |

