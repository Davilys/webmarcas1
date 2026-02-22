
# Botao "Gerar Novo Link" com Atualizacao de Template

## O que muda

Na ficha de detalhes do contrato (ContractDetailSheet), quando o contrato esta **nao assinado** e com link **expirado**, adicionar um botao "Gerar Novo Link" ao lado do botao "Regenerar". Este botao:

1. Busca o template de contrato padrao ativo no momento (tabela `contract_templates`)
2. Reprocessa o HTML do contrato com os dados do cliente (profiles) e da marca (contracts), aplicando o template atual em vigor
3. Atualiza o `contract_html` do contrato no banco
4. Gera um novo `signature_token` e `signature_expires_at` (chamando a edge function `generate-signature-link`)
5. Resultado: contrato atualizado para a versao vigente + novo link pronto para envio

## Onde aparece

Somente quando:
- Contrato **nao esta assinado** (`signature_status != 'signed'`)
- Link esta **expirado** (`isExpired = true`)

O botao aparece ao lado do "Regenerar" existente.

## Diferenca entre os botoes

- **Regenerar**: apenas cria novo token/link, mantendo o HTML do contrato como esta
- **Gerar Novo Link**: atualiza o conteudo do contrato para o template padrao atual E cria novo link

## Mudancas Tecnicas

### 1. `src/components/admin/contracts/ContractDetailSheet.tsx`

Nova funcao `generateNewContractLink`:
- Busca o template ativo: `SELECT content FROM contract_templates WHERE is_active = true AND name ILIKE '%Registro de Marca%' LIMIT 1`
- Busca os dados do cliente: `SELECT * FROM profiles WHERE id = contract.user_id`
- Busca os dados do contrato (subject = marca, payment_method, etc.)
- Aplica `replaceContractVariables` (importado de `useContractTemplate`) com os dados reais
- Gera o HTML completo com `generateContractPrintHTML` (importado de `ContractRenderer`)
- Atualiza o contrato: `UPDATE contracts SET contract_html = novoHtml WHERE id = contractId`
- Chama `generate-signature-link` para gerar novo token
- Exibe toast de sucesso e atualiza a view

Novo botao no JSX (linha ~680-691), dentro do `div.flex.gap-2`, ao lado de "Regenerar":
```
{isExpired && (
  <Button size="sm" className="h-7 text-xs" onClick={generateNewContractLink} disabled={generatingNewLink}>
    {generatingNewLink ? <Loader2 /> : <RefreshCw />}
    Gerar Novo Link
  </Button>
)}
```

Novo estado: `generatingNewLink` (boolean)

### 2. Import adicional

Importar `replaceContractVariables` de `@/hooks/useContractTemplate` e `generateContractPrintHTML` de `@/components/contracts/ContractRenderer` (ja importado como `generateDocumentPrintHTML`).

### Nenhuma outra mudanca
- Sem alteracao em tabelas
- Sem alteracao em edge functions
- Sem novos secrets
