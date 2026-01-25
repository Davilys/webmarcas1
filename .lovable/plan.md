
## Plano: Implementar Funcionalidade de Download PDF na Tabela de Contratos

### Problema Identificado

O botão **"Download PDF"** no menu de ações da tabela de contratos (página `/admin/contratos`) não possui funcionalidade implementada - o `onClick` está vazio. Isso está inconsistente com o mesmo botão dentro do `ContractDetailSheet`, que funciona corretamente.

### Análise Técnica

| Local | Status | Funcionalidade |
|-------|--------|----------------|
| `ContractDetailSheet` (linha 515-527) | ✅ Funcionando | Usa `downloadPDF()` → `openPreview(true)` |
| `Contratos.tsx` dropdown (linha 319-322) | ❌ Sem onClick | Não faz nada ao clicar |

O `ContractDetailSheet` usa a função `openPreview(triggerPrint = true)` que:
1. Gera o HTML do documento via `generateDocumentPrintHTML`
2. Abre uma nova janela com botões "Salvar como PDF" e "Fechar"
3. Automaticamente abre o diálogo de impressão se `triggerPrint = true`

### Solução Proposta

Implementar a funcionalidade de download diretamente na tabela, reutilizando a mesma lógica do `ContractDetailSheet`.

---

### Alterações no Arquivo `src/pages/admin/Contratos.tsx`

#### 1. Adicionar imports necessários

```typescript
import { Loader2 } from 'lucide-react';
import { generateDocumentPrintHTML, getLogoBase64ForPDF } from '@/components/contracts/DocumentRenderer';
```

#### 2. Adicionar estados para controle de loading

```typescript
const [downloadingId, setDownloadingId] = useState<string | null>(null);
```

#### 3. Criar função `handleDownloadPDF`

Busca o contrato completo (com `contract_html`) e gera o PDF seguindo o mesmo padrão visual do "Visualizar":

```typescript
const handleDownloadPDF = async (contractId: string) => {
  setDownloadingId(contractId);
  try {
    // Buscar contrato completo com contract_html
    const { data: fullContract, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (error || !fullContract) {
      toast.error('Erro ao carregar contrato');
      return;
    }

    if (!fullContract.contract_html) {
      toast.error('Documento sem conteúdo');
      return;
    }

    const logoBase64 = await getLogoBase64ForPDF();

    const printHtml = generateDocumentPrintHTML(
      (fullContract.document_type as any) || 'contract',
      fullContract.contract_html,
      fullContract.client_signature_image || null,
      fullContract.blockchain_hash ? {
        hash: fullContract.blockchain_hash,
        timestamp: fullContract.blockchain_timestamp || '',
        txId: fullContract.blockchain_tx_id || '',
        network: fullContract.blockchain_network || '',
        ipAddress: fullContract.signature_ip || '',
      } : undefined,
      fullContract.signatory_name || undefined,
      fullContract.signatory_cpf || undefined,
      fullContract.signatory_cnpj || undefined,
      undefined,
      window.location.origin,
      logoBase64
    );

    // Injetar botões de "Salvar como PDF" (mesmo padrão do Visualizar)
    const enhancedHtml = printHtml.replace('</head>', `
      <style>
        @media print { .no-print { display: none !important; } ... }
        .save-pdf-btn { position: fixed; top: 20px; right: 20px; ... }
      </style>
    </head>`).replace('<body', `<body><div class="save-pdf-btn no-print">
        <button class="btn-primary" onclick="window.print()">Salvar como PDF</button>
        <button class="btn-secondary" onclick="window.close()">Fechar</button>
      </div><body`);

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(enhancedHtml);
      newWindow.document.close();
      newWindow.onload = () => {
        setTimeout(() => newWindow.print(), 500);
      };
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    toast.error('Erro ao gerar PDF');
  } finally {
    setDownloadingId(null);
  }
};
```

#### 4. Atualizar o DropdownMenuItem de Download

De:
```typescript
<DropdownMenuItem>
  <Download className="h-4 w-4 mr-2" />
  Download PDF
</DropdownMenuItem>
```

Para:
```typescript
<DropdownMenuItem 
  onClick={() => handleDownloadPDF(contract.id)}
  disabled={downloadingId === contract.id}
>
  {downloadingId === contract.id ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    <Download className="h-4 w-4 mr-2" />
  )}
  Download PDF
</DropdownMenuItem>
```

---

### Resultado Esperado

| Ação | Antes | Depois |
|------|-------|--------|
| Clique em "Download PDF" | Nada acontece | Abre nova janela com botões "Salvar como PDF" e "Fechar" + diálogo de impressão |
| Visual do documento | N/A | Idêntico ao "Visualizar" com timbrado, certificação e QR Code |
| Estado de loading | Não existe | Ícone de spinner durante carregamento |

---

### Arquivos a Modificar

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/pages/admin/Contratos.tsx` | Adicionar função `handleDownloadPDF` e conectar ao dropdown |
