

# Implementar Selecao de Classes NCL no Checkout (Site + Area do Cliente)

## Erros Identificados no Admin que Serao Evitados

Apos analisar a implementacao do painel administrativo (`CreateContractDialog.tsx`), identifiquei os seguintes pontos criticos que causaram problemas e que serao evitados:

1. **Gradiente CSS nao renderizando** - No `ClientDetailSheet`, as classes `from-X to-Y` eram aplicadas sem o `bg-gradient-to-r`. Todos os componentes novos terao gradientes completos.

2. **Sincronizacao de dados entre steps** - No admin, o `selectedClasses` e as descricoes precisam ser mapeados corretamente via indice. Se a IA retorna `classes: [25, 35, 42]` e `classDescriptions: ["Vestuario", "Publicidade", "Software"]`, o mapeamento precisa ser por posicao, nao por valor. O admin faz isso corretamente em `generateNewClientContractHtml` (linhas 353-361) e seguiremos o mesmo padrao.

3. **Valor nulo de classes quando viabilidade nao retorna classes** - A API `inpi-viability-check` pode retornar `classes: undefined`. O novo step precisa tratar o cenario de "nenhuma classe sugerida" mostrando uma mensagem informativa e permitindo prosseguir com 1 classe padrao.

4. **Edge function nao recebe selectedClasses** - Atualmente o `create-asaas-payment` no checkout nao recebe nem persiste `selectedClasses`. A funcao interna `replaceContractVariables` dentro da edge function (linhas 49-118) nao suporta classes. Precisamos enviar e persistir esses dados.

5. **Precos hardcoded vs dinamicos** - O admin usa valores hardcoded (699, 1194, 1197). O checkout publico ja usa `usePricing()` que busca do `system_settings`. Manteremos a consistencia usando `usePricing()` no novo step e multiplicando pelo numero de classes.

## Fluxo Atual vs Novo

```text
ATUAL (5 passos):
Viabilidade -> Dados Pessoais -> Dados da Marca -> Pagamento -> Contrato

NOVO (6 passos):
Viabilidade -> Dados Pessoais -> Dados da Marca -> Classes NCL -> Pagamento -> Contrato
```

## Alteracoes Detalhadas

### 1. NOVO: `src/components/cliente/checkout/NclClassSelectionStep.tsx`

Componente do novo Step 4 (selecao de classes NCL).

- Recebe `suggestedClasses: number[]`, `classDescriptions: string[]` e `brandName: string`
- Exibe cards com checkbox para cada classe sugerida pela IA (NENHUMA pre-selecionada - regra de negocio critica)
- Card informativo explicando o que sao classes NCL e por que proteger
- Resumo dinamico do valor usando `usePricing()` multiplicado pelo numero de classes selecionadas
- Validacao: minimo 1 classe selecionada para prosseguir
- Tratamento do cenario sem classes: se a IA nao retornou sugestoes, exibe mensagem e permite prosseguir sem selecao (1 classe padrao)
- Botoes Voltar/Continuar
- Interface: `onNext: (selectedClasses: number[], classDescriptions: string[]) => void`

### 2. MODIFICAR: `src/components/sections/RegistrationFormSection.tsx`

Orquestrador do checkout no site (landing page).

- Adicionar estados: `selectedClasses: number[]` e `classDescriptions: string[]`
- Extrair `classes` e `classDescriptions` do `viabilityData.result` no `handleViabilityNext`
- Inserir Step 4 (NclClassSelectionStep) entre BrandData (step 3) e Payment (agora step 5)
- Novo handler `handleNclNext` que salva `selectedClasses` e `classDescriptions` e avanca para step 5
- Recalcular `paymentValue` no `handlePaymentNext` multiplicando pelo `selectedClasses.length` (minimo 1)
- Passar `selectedClasses` e `classDescriptions` para `ContractStep`
- Passar `classCount` para `PaymentStep`
- Ajustar numeracao de steps (Payment = 5, Contract = 6)
- Enviar `selectedClasses` e `classDescriptions` no body do `create-asaas-payment`

### 3. MODIFICAR: `src/pages/cliente/RegistrarMarca.tsx`

Orquestrador do checkout na area do cliente (logado).

- Mesmas alteracoes do `RegistrationFormSection`: novos estados, novo step, novo handler
- Adicionar `selectedClasses` e `classDescriptions` ao `handleSubmit`
- Atualizar `STEP_TITLES` para 6 passos
- Atualizar indicador "Etapa X de 6"

### 4. MODIFICAR: `src/components/cliente/checkout/CheckoutProgress.tsx`

- Adicionar novo passo "Classes NCL" com icone `Grid3X3` ou `Layers` entre "Dados da Marca" e "Pagamento"
- Total de passos: 5 -> 6

### 5. MODIFICAR: `src/components/cliente/checkout/PaymentStep.tsx`

- Receber nova prop opcional `classCount?: number` (default 1)
- Multiplicar todos os valores exibidos por `classCount`
- Exibir badge informativo "X classes selecionadas" quando classCount > 1
- Retornar o valor total (ja multiplicado) no `onNext`

### 6. MODIFICAR: `src/components/cliente/checkout/ContractStep.tsx`

- Receber novas props `selectedClasses?: number[]` e `classDescriptions?: string[]`
- Passar para `replaceContractVariables` para que Clausula 1.1 (lista de classes) e Clausula 5.1 (valores) reflitam a selecao
- O `paymentValue` ja vira multiplicado do PaymentStep

### 7. MODIFICAR: `supabase/functions/create-asaas-payment/index.ts`

- Adicionar `selectedClasses` e `classDescriptions` na interface `PaymentRequest`
- Apos criar o contrato, fazer `UPDATE` no campo `suggested_classes` com formato JSONB: `{ classes: suggestedClasses, descriptions: classDescriptions, selected: selectedClasses }`
- Atualizar a funcao interna `replaceContractVariables` da edge function para suportar classes (injetar na clausula 1.1 e calcular valores na 5.1)

## Detalhes de Seguranca

- Nenhuma alteracao de schema ou RLS necessaria (campo `suggested_classes` ja existe na tabela `contracts`)
- Valores finais sao sempre recalculados no servidor (edge function) com base no `paymentMethod`, nunca confiando apenas no `paymentValue` do cliente

## Arquivos Modificados

| Arquivo | Tipo | Risco |
|---|---|---|
| `src/components/cliente/checkout/NclClassSelectionStep.tsx` | Novo | Baixo |
| `src/components/sections/RegistrationFormSection.tsx` | Modificado | Medio |
| `src/pages/cliente/RegistrarMarca.tsx` | Modificado | Medio |
| `src/components/cliente/checkout/CheckoutProgress.tsx` | Modificado | Baixo |
| `src/components/cliente/checkout/PaymentStep.tsx` | Modificado | Baixo |
| `src/components/cliente/checkout/ContractStep.tsx` | Modificado | Baixo |
| `supabase/functions/create-asaas-payment/index.ts` | Modificado | Alto |

