
# Correção: Documentos Duplicados e Erros de JWT Expirado

## Diagnóstico

O problema tem **duas causas raízes**:

### Causa 1 — Duplicação
A função `fetchDocs` em `Documentos.tsx` busca dados de **duas fontes**:
- Tabela `contracts` → gera os cards bonitos (com "Visualizar" e "Baixar PDF")
- Tabela `documents` → busca todos os documentos do usuário (inclui os PDFs gerados pela Edge Function)

A Edge Function `upload-signed-contract-pdf` salva um registro na tabela `documents` com `contract_id` preenchido para cada contrato assinado. Resultado: cada contrato assinado aparece **duas vezes** na lista — uma vez como contrato (bonito), uma vez como arquivo PDF bruto (nome técnico).

### Causa 2 — Erro JWT expirado
Os registros duplicados na tabela `documents` apontam para **Signed URLs** do Supabase Storage com validade de apenas 24 horas. Após esse prazo, a URL expira e ao tentar abrir aparece: `{"statusCode":"400","error":"InvalidJWT","message":"\"exp\" claim timestamp check failed"}`.

## Solução

### Correção 1 — Filtrar documentos que são PDFs de contratos (tabela `documents`)
Na query da tabela `documents`, **excluir** os registros que têm `contract_id` preenchido e cujo nome começa com padrão técnico gerado pela Edge Function. A abordagem mais robusta é filtrar na query:

```typescript
// ANTES: busca todos os documentos do usuário
supabase.from('documents').select('*').eq('user_id', uid)

// DEPOIS: exclui documentos que são PDFs de contratos (já aparecem como contratos)
supabase.from('documents').select('*').eq('user_id', uid).is('contract_id', null)
```

Isso garante que PDFs gerados automaticamente pela assinatura (que têm `contract_id`) não apareçam novamente na lista, já que o contrato original já está sendo exibido pela query da tabela `contracts`.

### Correção 2 — Renovar Signed URLs expiradas sob demanda (DocumentPreview)
Para os documentos da tabela `documents` que **ainda têm** `contract_id` nulo (uploads manuais, taxas, etc.) e usam Signed URLs, implementar lógica de renovação automática no `DocumentPreview.tsx` quando a URL expirar.

O `DocumentPreview.tsx` já tem lógica de `trySignedUrl()` mas só é acionada quando carregamento falha. A melhoria é detectar URLs assinadas expiradas **antes** de tentar carregar.

### Correção 3 — Mudar Storage de Signed URL para Public URL no upload-signed-contract-pdf
A raiz do problema de URLs expiradas está na Edge Function `upload-signed-contract-pdf` que usa `createSignedUrl` com 24 horas. Como o bucket `documents` é **público**, deve usar `getPublicUrl` em vez de `createSignedUrl`:

```typescript
// ANTES (expira em 24h):
const { data: signedData } = await supabase.storage
  .from('documents')
  .createSignedUrl(filePath, 86400);

// DEPOIS (permanente, bucket é público):
const { data: publicData } = supabase.storage
  .from('documents')
  .getPublicUrl(filePath);
const publicUrl = publicData.publicUrl;
```

## Arquivos a modificar

### 1. `src/pages/cliente/Documentos.tsx`
Na função `fetchDocs`, adicionar `.is('contract_id', null)` na query de documentos para excluir PDFs de contratos que já aparecem via tabela `contracts`.

### 2. `supabase/functions/upload-signed-contract-pdf/index.ts`
Substituir `createSignedUrl` por `getPublicUrl` para que os URLs dos PDFs nunca expirem (bucket já é público).

## Resultado esperado

- Cada contrato/procuração aparece **uma única vez** — o card bonito com nome amigável, badges de Blockchain/Assinado e botões "Visualizar"/"Baixar PDF"
- Os PDFs armazenados no Storage terão URLs permanentes que nunca expiram
- Documentos enviados manualmente pelo cliente (sem `contract_id`) continuam aparecendo normalmente

## Impacto nos dados existentes

Os 2 registros duplicados na tabela `documents` que já existem (com `contract_id` preenchido) deixarão de aparecer na UI imediatamente após a correção do filtro. Eles continuam no banco, mas não serão mais exibidos — sem risco de perda de dados.
