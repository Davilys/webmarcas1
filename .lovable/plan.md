
# Sugestao de Classes NCL na Pagina de Assinatura

## O que sera feito

Na pagina de assinatura (`/assinar/:token`), entre o conteudo do contrato e o checkbox "Declaro que li...", adicionar um card de sugestao de classes NCL complementares. Se o cliente selecionar classes adicionais, o contrato e o valor sao atualizados automaticamente antes da assinatura.

## Fluxo do Usuario

1. Cliente abre o link de assinatura
2. Le o contrato normalmente
3. Antes do checkbox de aceite, ve um card: "Protecao Complementar Recomendada pelo Juridico"
4. Card mostra classes sugeridas com descricao do que cada uma protege (ex: "Classe 35 - Protege atividades comerciais, franquias e publicidade da sua marca")
5. Cliente pode selecionar 1 ou mais classes adicionais via checkbox
6. Ao selecionar, o contrato e valor atualizam automaticamente (ex: de R$ 699 para R$ 1.398 no PIX)
7. Entao aceita os termos e assina normalmente

## Detalhes Tecnicos

### 1. Nova coluna no banco (aditiva, nullable)

Adicionar `suggested_classes` (jsonb, nullable) na tabela `contracts`. Formato:

```text
[
  { "number": 35, "description": "Comercio, franquias e publicidade", "selected": false },
  { "number": 42, "description": "Servicos tecnologicos e cientificos", "selected": false }
]
```

Isso armazena as classes sugeridas pelo laudo de viabilidade que NAO foram selecionadas pelo cliente no checkout. Coluna nullable, nao afeta contratos existentes.

### 2. Edge Function: `get-contract-by-token`

Atualizar para incluir `suggested_classes` e `contract_value` no SELECT, para que a pagina de assinatura tenha acesso aos dados.

### 3. Nova Edge Function: `update-contract-classes`

Cria uma edge function isolada que:
- Recebe `contractId` e `selectedClasses` (array de numeros)
- Busca o contrato atual (via service role)
- Verifica que ainda nao foi assinado (`signature_status != 'signed'`)
- Recalcula o valor: valor base * (1 + classes adicionais selecionadas)
- Regenera o `contract_html` com as novas classes na clausula 1.1
- Atualiza `contracts.contract_value`, `contracts.contract_html` e `contracts.suggested_classes`
- Retorna o contrato atualizado

### 4. Pagina `AssinarDocumento.tsx`

Entre o bloco do DocumentRenderer e a secao "Assinatura Eletronica":

- Verificar se `contract.suggested_classes` existe e tem itens
- Se sim, renderizar card com:
  - Titulo: "Protecao Complementar Recomendada"
  - Subtitulo: "Nosso departamento juridico sugere proteger sua marca tambem nas classes abaixo"
  - Lista de classes com checkbox, numero e descricao
  - Resumo de valor atualizado ao selecionar
  - Botao "Confirmar classes adicionais" que chama a edge function
- Apos confirmacao, recarrega o contrato com os novos dados

### 5. Preenchimento das classes sugeridas

No momento de criacao do contrato (checkout e admin), popular o campo `suggested_classes` com as classes do laudo que nao foram selecionadas. Isso sera feito:
- No `ContractStep.tsx` (checkout do cliente): ao submeter, incluir as classes nao selecionadas
- No `CreateContractDialog.tsx` (admin): campo opcional para adicionar classes sugeridas

## O que NAO muda

- Tabelas existentes (apenas adiciona coluna nullable)
- Fluxo de assinatura (blockchain, PDF, certificacao)
- Edge functions existentes (sign-contract-blockchain, create-post-signature-payment)
- Layout principal da pagina de assinatura
- Contratos ja existentes (coluna nullable, sem impacto)
- APIs externas (Asaas, INPI)
- Permissoes e RLS
