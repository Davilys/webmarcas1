
## Plano de Correção: Renderização de Contratos Conforme Modelo Definido pelo Administrador

### Problema Identificado

O sistema possui **múltiplos pontos de renderização de contratos** que **não respeitam o `document_type`** definido pelo administrador. Isso resulta em:

1. **Procurações exibindo cabeçalho de contrato** ("Acordo do Contrato - Anexo I" em vez de "PROCURAÇÃO PARA REPRESENTAÇÃO JUNTO AO INPI")
2. **Checkout do cliente sempre mostra layout de contrato**, mesmo quando o template selecionado é uma Procuração
3. **PDFs gerados com cabeçalho errado** em vários locais

---

### Locais Afetados (7 arquivos)

| # | Arquivo | Problema |
|---|---------|----------|
| 1 | `src/components/cliente/checkout/ContractStep.tsx` | `documentType` **hardcoded como `'contract'`** nas linhas 53 e 70. Não detecta tipo do template |
| 2 | `src/components/contracts/ContractRenderer.tsx` | Função `generateContractPrintHTML` (linha 370) **não aceita parâmetro `documentType`** - sempre gera layout de contrato |
| 3 | `src/hooks/useUnifiedContractDownload.ts` | Função `generateContractHTML` (linha 53) **já suporta documentType**, mas o chamador no ContractStep não passa corretamente |
| 4 | `src/components/sections/RegistrationFormSection.tsx` | Usa `generateContractPrintHTML` sem passar `documentType` (linhas 340 e 378) |
| 5 | `src/hooks/useContractPdfUpload.ts` | Função `generateSignedContractHtml` (linha 167) **não recebe `documentType`** - sempre gera layout de contrato |
| 6 | `supabase/functions/create-asaas-payment/index.ts` | Função de geração de HTML **hardcoded como contrato** (linha 397) |
| 7 | `src/hooks/useContractTemplate.ts` | Hook não retorna informação sobre o tipo de documento do template |

---

### Solução Proposta

#### 1. Atualizar `useContractTemplate.ts`
- Adicionar função `getDocumentTypeFromTemplateName` para detectar tipo pelo nome do template
- Expor o tipo de documento detectado no retorno do hook

#### 2. Atualizar `ContractStep.tsx` (Checkout do Cliente)
- Detectar automaticamente o tipo de documento baseado no nome do template
- Passar `documentType` correto para `ContractRenderer` e funções de download/impressão

**Mudança chave (linha 37):**
```typescript
// ANTES
const { template, isLoading } = useContractTemplate('Contrato Padrão - Registro de Marca INPI');

// DEPOIS
const { template, isLoading, documentType } = useContractTemplate('Contrato Padrão - Registro de Marca INPI');
```

**Mudança na renderização (linha 182):**
```typescript
// ANTES
<ContractRenderer 
  content={getProcessedContract()} 
  showLetterhead={true}
  showCertificationSection={false}
/>

// DEPOIS  
<ContractRenderer 
  content={getProcessedContract()} 
  showLetterhead={true}
  showCertificationSection={false}
  documentType={documentType}
/>
```

#### 3. Atualizar `generateContractPrintHTML` em `ContractRenderer.tsx`
- Adicionar parâmetro `documentType` opcional
- Renderizar cabeçalho correto baseado no tipo (procuração, distrato, ou contrato)

**Assinatura atualizada:**
```typescript
export function generateContractPrintHTML(
  content: string,
  brandName: string,
  clientName: string,
  clientCpf: string,
  blockchainSignature?: BlockchainSignature,
  showCertificationSection: boolean = true,
  documentType: 'contract' | 'procuracao' | 'distrato_multa' | 'distrato_sem_multa' = 'contract'
): string
```

**Lógica de cabeçalho:**
```typescript
// Dentro do HTML gerado:
${documentType === 'procuracao' ? `
  <h1 class="main-title">PROCURAÇÃO PARA REPRESENTAÇÃO JUNTO AO INPI</h1>
  <p class="subtitle">Instrumento Particular de Procuração para fins de Registro de Marca</p>
  <div class="highlight-box">
    <p>Pelo presente instrumento particular de PROCURAÇÃO...</p>
  </div>
` : `
  <h1 class="main-title">Acordo do Contrato - Anexo I</h1>
  <div class="contract-title-box">
    <p>CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS...</p>
  </div>
  <div class="highlight-box">
    <p>Os termos deste instrumento aplicam-se apenas...</p>
  </div>
`}
```

#### 4. Atualizar `RegistrationFormSection.tsx`
- Passar `documentType` nas chamadas de `generateContractPrintHTML`

#### 5. Atualizar `useContractPdfUpload.ts`
- Adicionar parâmetro `documentType` em `generateSignedContractHtml`
- Usar lógica condicional para renderizar cabeçalho correto

#### 6. Atualizar Edge Function `create-asaas-payment`
- Adicionar suporte a `documentType` na função de geração de HTML do contrato

---

### Arquivos a Modificar

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/hooks/useContractTemplate.ts` | Adicionar detecção de `documentType` e exportar no hook |
| `src/components/cliente/checkout/ContractStep.tsx` | Usar `documentType` do hook e passar para componentes |
| `src/components/contracts/ContractRenderer.tsx` | Atualizar `generateContractPrintHTML` para aceitar e usar `documentType` |
| `src/components/sections/RegistrationFormSection.tsx` | Passar `documentType` nas chamadas de geração de HTML |
| `src/hooks/useContractPdfUpload.ts` | Adicionar parâmetro `documentType` em `generateSignedContractHtml` |
| `src/hooks/useUnifiedContractDownload.ts` | Verificar se já suporta corretamente (já tem suporte) |
| `supabase/functions/create-asaas-payment/index.ts` | Adicionar lógica condicional baseada em `documentType` |

---

### Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Template "Procuração INPI" no checkout | "Acordo do Contrato - Anexo I" | "PROCURAÇÃO PARA REPRESENTAÇÃO JUNTO AO INPI" |
| Download PDF de Procuração | Cabeçalho de contrato | Cabeçalho de procuração |
| Impressão de Procuração | Layout errado | Layout correto |
| Template de Distrato | Pode mostrar como contrato | Mostra como "Acordo de Distrato" |

---

### Checklist de Validação

- [ ] `ContractRenderer` exibe cabeçalho correto baseado em `documentType`
- [ ] `generateContractPrintHTML` aceita e usa `documentType`
- [ ] Checkout do cliente detecta automaticamente tipo do template
- [ ] PDFs gerados respeitam o tipo de documento
- [ ] Impressão respeita o tipo de documento
- [ ] Edge function de pagamento respeita o tipo
- [ ] Todos os locais passam `documentType` corretamente

---

### Ordem de Implementação

1. **`useContractTemplate.ts`** - Base para detecção de tipo
2. **`ContractRenderer.tsx`** - Componente central de renderização e função `generateContractPrintHTML`
3. **`ContractStep.tsx`** - Checkout do cliente
4. **`RegistrationFormSection.tsx`** - Formulário de registro público
5. **`useContractPdfUpload.ts`** - Upload de PDFs assinados
6. **`create-asaas-payment/index.ts`** - Edge function de pagamento
