
# Sistema Dinamico de Classes NCL - Contrato Inteligente

## Resumo

Implementar selecao de classes NCL sugeridas em 4 pontos do sistema:
1. **Formulario do cliente** (BrandDataStep) - checkboxes com classes do laudo
2. **Pagamento dinamico** (PaymentStep) - valor multiplica por quantidade de classes
3. **Contrato + Upsell na assinatura** (ContractStep + AssinarDocumento) - classes no contrato + sugestao das nao selecionadas antes do aceite
4. **Botao IA no Admin** (CreateContractDialog) - gerar classes sugeridas por ramo de atividade

## Fluxo Completo

### No formulario do cliente (site/portal)

1. Cliente faz busca de viabilidade -- resultado retorna `classes: [25, 18, 14]` e `classDescriptions: ["Vestuario...", "Artigos de couro...", "Metais preciosos..."]`
2. No passo "Dados da Marca", abaixo do campo "Ramo de Atividade", aparece secao "Classes NCL Sugeridas" com checkboxes (imagem 1)
   - Primeira classe tem badge "Principal"
   - Botao "Todas" para selecionar todas
   - **NENHUMA classe vem pre-selecionada** (selecao 100% manual)
3. No passo "Pagamento", valores multiplicam pela quantidade de classes selecionadas
4. No passo "Contrato", clausula 1.1 lista as classes selecionadas
5. Se selecionou menos de 3, entre o contrato e o checkbox de aceite, aparece card "Protecao Complementar Recomendada" (imagem 2) com as classes nao selecionadas e preco unitario ao lado

### Na pagina de assinatura (/assinar/:token)

- Se o contrato tem `suggested_classes` salvas e o cliente selecionou menos, aparece o mesmo card de upsell antes do checkbox "Declaro que li..."
- Ao selecionar uma classe extra, o contrato_html e o valor sao atualizados via estado reativo (sem reload)

### No painel Admin (Novo Contrato)

- Na aba "Dados da Marca", ao lado do campo "Ramo de Atividade", botao "Sugerir Classes" que chama a mesma edge function de viabilidade
- Retorna 3 classes como checkboxes (nenhuma pre-selecionada)
- Admin seleciona e o contrato/valor calculam automaticamente

## Detalhes Tecnicos

### Arquivo 1: `src/pages/cliente/RegistrarMarca.tsx`
- Adicionar estados `suggestedClasses` e `selectedClasses` (arrays de `{number, description}`)
- Ao receber resultado da viabilidade (`handleViabilityNext`), extrair `result.classes` e `result.classDescriptions`
- Passar para BrandDataStep, PaymentStep e ContractStep
- Passar `selectedClasses` no body do `create-asaas-payment`

### Arquivo 2: `src/components/cliente/checkout/BrandDataStep.tsx`
- Receber props `suggestedClasses` e `selectedClasses` com callback `onClassesChange`
- Abaixo do campo "Ramo de Atividade", renderizar secao "Classes NCL Sugeridas":
  - Header com icone Shield + titulo + botao "Todas"
  - Cards com checkbox, numero da classe, badge "Principal" na primeira, descricao
  - Estado inicial: nenhuma selecionada (selected = false)
- Interface BrandData inalterada (classes gerenciadas separadamente no pai)

### Arquivo 3: `src/components/cliente/checkout/PaymentStep.tsx`
- Receber prop `classCount: number` (default 1)
- Multiplicar todos os valores do `usePricing()` por `classCount`
- Badge no topo: "X classes de protecao selecionadas"
- Se classCount = 0, bloquear botao "Continuar"

### Arquivo 4: `src/components/cliente/checkout/ContractStep.tsx`
- Receber props `selectedClasses`, `suggestedClasses`, `onClassesChange`
- Passar `selectedClasses` para `replaceContractVariables`
- Entre o ScrollArea do contrato e o checkbox de aceite, se `selectedClasses.length < suggestedClasses.length`:
  - Card "Classes NCL de Protecao" (imagem 2)
  - Secao "Selecionadas no Formulario" mostra as ja escolhidas
  - Secao "Protecao Complementar Recomendada" mostra as restantes com "+ R$ 698,97" ao lado
  - Ao marcar, chama `onClassesChange` que atualiza estado no pai, recalcula contrato e valor
- Atualizar resumo do pedido com valor recalculado

### Arquivo 5: `src/hooks/useContractTemplate.ts`
- Atualizar `replaceContractVariables` para aceitar parametro opcional `selectedClasses?: {number: number, description: string}[]`
- Se `selectedClasses` existir e tiver mais de 1, formatar clausula 1.1 com lista numerada:
  "1. Marca: X - Classe NCL: 25. 2. Marca: X - Classe NCL: 35."
- Ajustar clausula 5.1 com valor total baseado na quantidade de classes
- Reutilizar logica existente de `formatMultipleBrandsInline`

### Arquivo 6: `src/pages/AssinarDocumento.tsx`
- Ao carregar contrato, verificar se tem `suggested_classes` (campo jsonb na tabela contracts)
- Se sim, e se as classes no contrato sao menos que as sugeridas, exibir card de upsell entre o documento e o checkbox de aceite
- Ao selecionar classe extra:
  - Atualizar `contract_html` localmente (recalcular clausulas 1.1 e 5.1)
  - Atualizar valor no contrato via supabase update
  - Nao recarregar pagina

### Arquivo 7: `src/components/admin/contracts/CreateContractDialog.tsx`
- Na aba "Dados da Marca" (tanto single brand quanto multiple), adicionar botao "Sugerir Classes" ao lado do campo "Ramo de Atividade"
- Ao clicar, chamar `supabase.functions.invoke('inpi-viability-check', { body: { brandName, businessArea } })`
- Com o resultado, renderizar checkboxes das 3 classes sugeridas (nenhuma pre-selecionada)
- Admin seleciona manualmente
- Ao gerar contrato, incluir classes selecionadas na clausula 1.1
- Salvar `suggested_classes` no campo jsonb do contrato ao inserir
- Calcular valor: `getContractValue()` multiplica pelo numero de classes selecionadas

### Arquivo 8: `supabase/functions/create-asaas-payment/index.ts` (ajuste minimo)
- Receber `selectedClasses` no body
- Salvar no campo `suggested_classes` do contrato criado

## Regras Criticas

- NENHUMA classe e pre-selecionada automaticamente (nem pela IA, nem por default)
- Classe principal aparece com badge visual mas NAO marcada
- Se 0 classes selecionadas, bloquear avancar no formulario
- Funcao de calculo isolada: `valor_unitario * qtdClasses`
- Nenhuma alteracao no banco existente (campo `suggested_classes` jsonb ja existe na tabela contracts)
- Nenhuma alteracao em APIs de cobranca
- Nenhuma alteracao estrutural de layout
- Contratos antigos nao sao afetados
- Se qualquer erro de renderizacao, componente retorna gracefully sem quebrar

## O que NAO muda

- Tabelas do banco de dados (campo `suggested_classes` ja existe)
- Edge functions de cobranca (Asaas)
- Fluxo de assinatura digital/blockchain
- PDF/impressao
- Permissoes/RLS
- Layout principal
- Contratos ja criados
