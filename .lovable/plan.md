
# Plano de Correção: Padronizar Visualização de Contratos no Portal do Cliente

## Problema Identificado

A visualização de contratos na área do cliente (`/cliente/documentos`) não exibe o mesmo padrão visual que o administrador vê. Especificamente:

1. **O `DocumentPreview` busca dados de blockchain mas não os utiliza**
2. **Falta a seção de certificação digital completa**
3. **Não exibe informações do signatário (nome, CPF, CNPJ)**
4. **Não usa o mesmo componente de renderização que o admin**

## Diferenças Técnicas

| Aspecto | Admin (ContractDetailSheet) | Cliente (DocumentPreview) |
|---------|----------------------------|---------------------------|
| Componente | `DocumentRenderer` | `ContractRenderer` |
| Dados Blockchain | Busca e exibe | Busca mas NÃO usa |
| Signatário | Nome, CPF, CNPJ | Não exibe |
| Certificação Digital | Completa | Parcial ou ausente |
| Download PDF | Usa `generateDocumentPrintHTML` | Link direto |

## Solução

Modificar o componente `DocumentPreview.tsx` para:

1. **Buscar dados completos do contrato** (incluindo signatário)
2. **Passar dados de blockchain para o componente de renderização**
3. **Usar o `DocumentRenderer` em vez do `ContractRenderer`** para consistência
4. **Implementar botão de download/print igual ao admin**

---

## Arquivos a Modificar

### 1. `src/components/shared/DocumentPreview.tsx`

**Mudanças:**

```text
A) Trocar import de ContractRenderer para DocumentRenderer
B) Ampliar query de busca para incluir dados do signatário  
C) Passar dados de blockchain e signatário para o renderer
D) Adicionar funcionalidade de download PDF igual ao admin
```

**Detalhes da Query Atualizada:**
```sql
SELECT 
  contract_html,
  blockchain_hash, 
  blockchain_timestamp, 
  signature_ip,
  blockchain_tx_id, 
  blockchain_network,
  document_type,
  signatory_name,
  signatory_cpf,
  signatory_cnpj,
  client_signature_image
FROM contracts
WHERE id = :contractId
```

**Novo fluxo de renderização:**
- Usar `DocumentRenderer` com `documentType` correto
- Passar `blockchainSignature` com todos os dados
- Passar dados do signatário para exibição
- Habilitar `showCertificationSection` quando contrato estiver assinado

---

## Código Específico

### Estado adicional para dados completos:
```typescript
const [contractData, setContractData] = useState<{
  contract_html: string | null;
  blockchain_hash: string | null;
  blockchain_timestamp: string | null;
  signature_ip: string | null;
  blockchain_tx_id: string | null;
  blockchain_network: string | null;
  document_type: string | null;
  signatory_name: string | null;
  signatory_cpf: string | null;
  signatory_cnpj: string | null;
  client_signature_image: string | null;
} | null>(null);
```

### Query atualizada:
```typescript
const { data, error } = await supabase
  .from('contracts')
  .select(`
    contract_html, 
    blockchain_hash, 
    blockchain_timestamp, 
    signature_ip, 
    blockchain_tx_id, 
    blockchain_network,
    document_type,
    signatory_name,
    signatory_cpf,
    signatory_cnpj,
    client_signature_image
  `)
  .eq('id', contractId)
  .single();
```

### Renderização com DocumentRenderer:
```typescript
<DocumentRenderer
  documentType={contractData.document_type || 'contract'}
  content={contractData.contract_html}
  clientSignature={contractData.client_signature_image}
  blockchainSignature={contractData.blockchain_hash ? {
    hash: contractData.blockchain_hash,
    timestamp: contractData.blockchain_timestamp || '',
    txId: contractData.blockchain_tx_id || '',
    network: contractData.blockchain_network || '',
    ipAddress: contractData.signature_ip || '',
  } : undefined}
  showCertificationSection={document.signature_status === 'signed'}
  signatoryName={contractData.signatory_name}
  signatoryCpf={contractData.signatory_cpf}
  signatoryCnpj={contractData.signatory_cnpj}
/>
```

### Botão de Download PDF (igual ao admin):
```typescript
const handlePrintPDF = async () => {
  if (!contractData?.contract_html) return;
  
  const logoBase64 = await getLogoBase64ForPDF();
  const printHtml = generateDocumentPrintHTML(
    contractData.document_type || 'contract',
    contractData.contract_html,
    contractData.client_signature_image,
    contractData.blockchain_hash ? {
      hash: contractData.blockchain_hash,
      timestamp: contractData.blockchain_timestamp || '',
      txId: contractData.blockchain_tx_id || '',
      network: contractData.blockchain_network || '',
      ipAddress: contractData.signature_ip || '',
    } : undefined,
    contractData.signatory_name,
    contractData.signatory_cpf,
    contractData.signatory_cnpj,
    undefined,
    window.location.origin,
    logoBase64
  );
  
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(printHtml);
    newWindow.document.close();
    newWindow.onload = () => setTimeout(() => newWindow.print(), 500);
  }
};
```

---

## Resultado Esperado

Após as correções:

1. O cliente verá o contrato **exatamente igual** ao que o admin vê
2. Seção de certificação digital completa (Hash, IP, Timestamp, QR Code)
3. Informações do signatário visíveis
4. Botão de download PDF funcional
5. Mesma formatação visual e layout
