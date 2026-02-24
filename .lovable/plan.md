
# Correcao: Pagamento nao aparece + Download ilegivel apos assinatura

## Problema 1: Pagina de pagamento nao aparece

### Causa raiz (duas camadas)

**Camada A -- Stale closure (bug no codigo):**
Na funcao `handleSign` (linha 407), apos `await fetchContract()`, o codigo verifica `contract.payment_method`. Porem, `contract` e uma referencia ao estado React ANTIGO (closure). O `fetchContract` chama `setContract(...)` que atualiza o estado, mas a variavel `contract` dentro de `handleSign` continua apontando para o valor antigo. Resultado: mesmo que o contrato tenha `payment_method` no banco, a verificacao sempre usa o valor antigo (que pode ser null antes do refresh).

**Camada B -- Contrato sem payment_method (dados):**
O contrato `f0243cf5-...` tem `payment_method = NULL` no banco. A clausula 5.1 diz "Forma de pagamento a ser definida", confirmando que o admin nao selecionou metodo de pagamento ao criar o contrato. Mesmo corrigindo o closure, o pagamento nao seria gerado para este contrato especifico.

### Correcao

**Arquivo:** `src/pages/AssinarDocumento.tsx` (funcao `handleSign`, linhas 400-409)

- Fazer `fetchContract` retornar os dados do contrato atualizado em vez de depender do estado React
- Usar o retorno direto para verificar `payment_method`
- Modificar `fetchContract` para retornar `result.contract` alem de chamar `setContract`
- Na verificacao, usar o dado retornado: `const refreshed = await fetchContract(); if (refreshed?.payment_method) { await createPaymentAfterSignature(); }`

## Problema 2: Download do documento assinado nao legivel

### Causa raiz

Apos assinar, o codigo gera e faz upload de um PDF em background (linhas 366-397) usando `generateSignedContractHtml`. Esta funcao (em `useContractPdfUpload.ts`, linha 185) processa o conteudo como texto puro, dividindo por `\n` e formatando cada linha. 

O problema e que ela usa `contract.contract_html` do closure ANTIGO (antes do `fetchContract`). Se o usuario selecionou classes extras via upsell, o `sign-contract-blockchain` ja atualizou o `contract_html` no banco, mas a referencia local ainda aponta para o HTML original. Alem disso, os dados de blockchain (`result.data.hash`, etc.) sao passados corretamente na geracao automatica do PDF.

Porem, para o download manual (botao "Baixar PDF", linha 434-507), o `handleDownloadPDF` usa `contract.contract_html` e `contract.blockchain_hash` do estado React. Se o `fetchContract` ja atualizou o estado (pos-assinatura), esses valores DEVEM estar corretos no momento do clique.

O problema REAL de legibilidade e que o `generateDocumentPrintHTML` na linha 447 tem o fallback `|| 'procuracao'` em vez de `|| 'contract'`. Para contratos, o `document_type` e 'contract' (correto), mas se por algum motivo fosse null, geraria um layout de procuracao (titulo errado, formatacao diferente) tornando-o "ilegivel" no sentido de incorreto.

**Correcao adicional:** A funcao `generateSignedContractHtml` (linha 370) usa `contract.contract_html` do closure antigo. Se o upsell modificou o HTML, o PDF enviado ao storage tera o conteudo ANTIGO (sem as classes extras). Precisa usar `displayContractHtml` (que contem as classes extras) ou o HTML atualizado retornado do banco.

### Correcoes

**Arquivo:** `src/pages/AssinarDocumento.tsx`

1. **Linha 144-179:** Modificar `fetchContract` para retornar o contrato:
   - `const fetchContract = async (): Promise<ContractData | null> => { ... return result.contract; }`

2. **Linha 366-398:** Usar `displayContractHtml` (com upsell) em vez de `contract.contract_html` para gerar o PDF:
   - `const signedHtml = generateSignedContractHtml(displayContractHtml || contract.contract_html, ...)`

3. **Linha 400-409:** Corrigir stale closure no fluxo de pagamento:
   ```
   const refreshedContract = await fetchContract();
   if (refreshedContract?.payment_method) {
     await createPaymentAfterSignature();
   }
   ```

4. **Linha 447:** Corrigir fallback de document_type:
   - De: `(contract.document_type as any) || 'procuracao'`
   - Para: `(contract.document_type as any) || 'contract'`

## Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| `src/pages/AssinarDocumento.tsx` | Corrigir fetchContract para retornar dados; usar displayContractHtml no PDF; corrigir stale closure no pagamento; corrigir fallback document_type |

## O que NAO sera alterado
- Nenhuma edge function
- Nenhuma tabela do banco
- Nenhum componente de UI
- Nenhum layout visual
- DocumentRenderer, DocumentPreview
