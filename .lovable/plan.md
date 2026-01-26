
# Plano: Unificar Padrão de Visualização e Download de Documentos

## Objetivo
Garantir que todos os botões de visualização e download de contratos/documentos sigam o mesmo padrão visual e funcional definido no `ContractDetailSheet.tsx` (Admin), incluindo:
1. Botões flutuantes "Salvar como PDF" e "Fechar"
2. Auto-abertura do diálogo de impressão
3. Dados de contato corretos em todos os PDFs

---

## Diagnóstico

### Locais que Precisam de Correção

| Arquivo | Problema Identificado |
|---------|----------------------|
| `src/pages/admin/Contratos.tsx` | Botão "Download PDF" no dropdown sem `onClick` |
| `src/pages/AssinarDocumento.tsx` | `handleDownloadPDF()` não injeta botões flutuantes |
| `src/components/shared/DocumentPreview.tsx` | `handlePrintPDF()` não injeta botões flutuantes |

### Dados de Contato Incorretos (8 arquivos)

Os PDFs e páginas estão exibindo:
- **E-mail errado**: `contato@webmarcas.net` ou `contato@webmarcas.com.br`
- **Telefone errado**: `(11) 4200-1656`

**Correção**: Substituir por:
- **E-mail**: `juridico@webmarcas.net`
- **Telefone**: `(11) 91112-0225`

---

## Alterações Planejadas

### 1. Corrigir Download PDF na Tabela de Contratos (Admin)

**Arquivo**: `src/pages/admin/Contratos.tsx`

- Adicionar estado `downloadingId` para controle de loading
- Criar função `handleDownloadPDF(contractId)`:
  - Buscar contrato completo com `contract_html`
  - Chamar `generateDocumentPrintHTML` com logo base64
  - Injetar botões "Salvar como PDF" / "Fechar"
  - Abrir nova janela + auto-trigger print
- Atualizar `DropdownMenuItem` para chamar a função

### 2. Padronizar Download em AssinarDocumento

**Arquivo**: `src/pages/AssinarDocumento.tsx`

Atualizar `handleDownloadPDF()` para injetar:

```text
<style>
  @media print { .no-print { display: none !important; } }
  .action-buttons { position: fixed; top: 20px; right: 20px; ... }
</style>
<div class="action-buttons no-print">
  <button onclick="window.print()">Salvar como PDF</button>
  <button onclick="window.close()">Fechar</button>
</div>
```

### 3. Padronizar Download em DocumentPreview

**Arquivo**: `src/components/shared/DocumentPreview.tsx`

Atualizar `handlePrintPDF()` para:
- Injetar botões flutuantes (mesmo estilo do admin)
- Manter auto-abertura do diálogo de impressão

### 4. Corrigir Dados de Contato em Todos os Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/components/contracts/DocumentRenderer.tsx` | Substituir telefone e e-mail (4 ocorrências) |
| `src/components/contracts/ContractRenderer.tsx` | Substituir e-mail (3 ocorrências) |
| `src/pages/AssinarDocumento.tsx` | Substituir telefone e e-mail (2 ocorrências) |
| `src/hooks/useUnifiedContractDownload.ts` | Substituir e-mail (1 ocorrência) |
| `src/hooks/useContractPdfUpload.ts` | Substituir e-mail (2 ocorrências) |
| `src/hooks/useContractPdfGenerator.ts` | Substituir e-mail (1 ocorrência) |
| `src/pages/VerificarContrato.tsx` | Substituir e-mail (2 ocorrências) |

---

## Detalhamento Técnico

### Padrão de Botões Flutuantes (CSS a ser injetado)

```css
.action-buttons {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  gap: 8px;
}
.action-buttons button {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.btn-primary {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
}
.btn-secondary {
  background: #f1f5f9;
  color: #334155;
}
@media print { .no-print { display: none !important; } }
```

### Substituição de Dados de Contato

| De | Para |
|----|------|
| `(11) 4200-1656` | `(11) 91112-0225` |
| `contato@webmarcas.net` | `juridico@webmarcas.net` |
| `contato@webmarcas.com.br` | `juridico@webmarcas.net` |

---

## Resultado Esperado

Após as alterações:

| Funcionalidade | Comportamento |
|----------------|---------------|
| Download PDF (Admin - Tabela) | Abre nova janela com botões + diálogo de impressão |
| Download PDF (Admin - Sheet) | Abre nova janela com botões + diálogo de impressão ✅ |
| Download PDF (AssinarDocumento) | Abre nova janela com botões + diálogo de impressão |
| Download PDF (DocumentPreview) | Abre nova janela com botões + diálogo de impressão |
| Download PDF (ProcessoDetalhe) | Abre nova janela com botões + diálogo de impressão ✅ |
| Dados de contato em PDFs | `juridico@webmarcas.net` / `(11) 91112-0225` |

---

## Arquivos a Modificar

1. `src/pages/admin/Contratos.tsx` - Implementar download funcional
2. `src/pages/AssinarDocumento.tsx` - Adicionar botões flutuantes + corrigir contato
3. `src/components/shared/DocumentPreview.tsx` - Adicionar botões flutuantes
4. `src/components/contracts/DocumentRenderer.tsx` - Corrigir dados de contato
5. `src/components/contracts/ContractRenderer.tsx` - Corrigir dados de contato
6. `src/hooks/useUnifiedContractDownload.ts` - Corrigir dados de contato
7. `src/hooks/useContractPdfUpload.ts` - Corrigir dados de contato
8. `src/hooks/useContractPdfGenerator.ts` - Corrigir dados de contato
9. `src/pages/VerificarContrato.tsx` - Corrigir dados de contato
