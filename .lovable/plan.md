
## Correção: PDF Idêntico à Visualização do Contrato

### Problema Identificado

O PDF gerado pela função `generateDocumentPrintHTML` em `DocumentRenderer.tsx` NÃO aplica as mesmas regras de formatação do componente React `ContractRenderer.tsx`. Especificamente:

1. **Títulos de cláusulas** - Na visualização aparecem em **azul negrito**, no PDF aparecem em texto preto simples
2. **Bloco de assinatura** - Na visualização está formatado corretamente, no PDF aparece com linhas `______`

---

### Causa Raiz

```typescript
// DocumentRenderer.tsx, linhas 655-660
const formattedContent = isHtmlContent 
  ? cleanedContent  // ← SE FOR HTML, USA O CONTEÚDO SEM FORMATAÇÃO!
  : cleanedContent
      .split('\n\n')
      .map(p => `<p class="content-paragraph">${p}</p>`)
      .join('');
```

O `ContractRenderer` (React) aplica regras de formatação ao renderizar:
- `/^\d+\.\s*CLÁUSULA/` → `<h2 style="color: #0284c7; font-weight: bold">`
- `/^_+$/` → ignora (não renderiza linhas `_____`)
- Formata partido e assinatura corretamente

Mas `generateDocumentPrintHTML` não aplica essas regras ao HTML do contrato!

---

### Solução

Criar uma função `formatContractContent` que aplique **exatamente as mesmas regras** do `ContractRenderer` ao conteúdo antes de inserir no template do PDF.

---

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/contracts/DocumentRenderer.tsx` | Adicionar função de formatação e aplicar no `formattedContent` |

---

### Detalhamento Técnico

#### Nova função `formatContractContent`:

```typescript
const formatContractContent = (content: string): string => {
  const lines = content.split('\n');
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();
    
    if (!trimmed) return '<div style="height: 12px;"></div>';
    
    // Skip the main contract title (already in header)
    if (trimmed.includes('CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS')) {
      return '';
    }
    
    // 1. Clause titles - BLUE BOLD (matching ContractRenderer exactly)
    if (/^\d+\.\s*CLÁUSULA/.test(trimmed)) {
      return `<h2 style="font-weight: bold; font-size: 12px; color: #0284c7 !important; margin-top: 20px; margin-bottom: 8px;">${trimmed}</h2>`;
    }
    
    // 2. Sub-items (10.1, 5.1, etc.) - with HTML support for <strong>
    if (/^\d+\.\d+\s/.test(trimmed)) {
      return `<p style="font-size: 11px; margin-bottom: 8px; padding-left: 16px;">${trimmed}</p>`;
    }
    
    // 3. Letter items (a), b), etc.)
    if (/^[a-z]\)/.test(trimmed)) {
      return `<p style="font-size: 11px; margin-bottom: 4px; padding-left: 32px;">${trimmed}</p>`;
    }
    
    // 4. Bullet points - with HTML support for <strong>
    if (trimmed.startsWith('•')) {
      return `<p style="font-size: 11px; margin-bottom: 8px; padding-left: 16px;">${trimmed}</p>`;
    }
    
    // 5. Roman numerals
    if (/^I+\)/.test(trimmed)) {
      return `<p style="font-size: 11px; margin-bottom: 12px; font-weight: 500;">${trimmed}</p>`;
    }
    
    // 6. SKIP signature underscores (electronic contracts don't use them)
    if (trimmed.match(/^_+$/)) {
      return ''; // Don't render _____ lines
    }
    
    // 7. Party identification headers
    if (trimmed === 'CONTRATADA:' || trimmed === 'CONTRATANTE:') {
      return `<p style="font-size: 11px; font-weight: bold; text-align: center; margin-top: 24px; margin-bottom: 4px;">${trimmed}</p>`;
    }
    
    // 8. Company name and CPF/CNPJ
    if (trimmed.includes('WEB MARCAS PATENTES EIRELI') || 
        trimmed.startsWith('CNPJ:') || 
        trimmed.startsWith('CPF:') ||
        trimmed.startsWith('CPF/CNPJ:')) {
      return `<p style="font-size: 10px; text-align: center; color: #6b7280; margin-bottom: 4px;">${trimmed}</p>`;
    }
    
    // 9. Date line
    if (trimmed.startsWith('São Paulo,')) {
      return `<p style="font-size: 11px; margin-top: 24px; margin-bottom: 24px;">${trimmed}</p>`;
    }
    
    // 10. Regular paragraphs
    return `<p style="font-size: 11px; margin-bottom: 12px; line-height: 1.6;">${trimmed}</p>`;
  });
  
  return formattedLines.filter(line => line !== '').join('\n');
};
```

#### Atualizar a lógica `formattedContent`:

```typescript
// ANTES
const formattedContent = isHtmlContent 
  ? cleanedContent
  : cleanedContent.split('\n\n').map(p => `<p class="content-paragraph">${p}</p>`).join('');

// DEPOIS - Aplicar formatação para TEXTO PURO extraído do HTML
// Extrair texto puro do HTML e aplicar formatação igual ao ContractRenderer
const extractTextFromHtml = (html: string): string => {
  // Remove tags HTML mas mantém o texto
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
};

const textContent = isHtmlContent ? extractTextFromHtml(cleanedContent) : cleanedContent;
const formattedContent = formatContractContent(textContent);
```

---

### Resultado Esperado

| Elemento | Visualização | PDF (após correção) |
|----------|--------------|---------------------|
| Título Cláusula | Azul negrito (#0284c7) | Azul negrito (#0284c7) ✓ |
| Sub-item 10.1 | Texto normal | Texto normal ✓ |
| Linhas `_____` | Não aparece | Não aparece ✓ |
| Bloco assinatura | Formatação clean | Formatação clean ✓ |
| Data "São Paulo, ..." | Margem correta | Margem correta ✓ |

---

### Retrocompatibilidade

| Cenário | Impacto |
|---------|---------|
| Contratos existentes | Formatação corrigida automaticamente |
| Procurações | Sem alteração (já funcionam) |
| Distratos | Mesma correção aplicada |
| Contratos texto puro | Continua funcionando |
