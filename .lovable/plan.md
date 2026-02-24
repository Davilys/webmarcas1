

## Plano: Classes Selecionaveis no Contrato com Atualizacao de Valor e Clausula

### Problema Atual
As classes sugeridas nao selecionadas aparecem no contrato apenas como aviso informativo, pedindo para o cliente voltar a etapa anterior. O cliente precisa poder selecionar diretamente no contrato, e ao fazer isso:
- O valor total deve ser recalculado
- A clausula 1.1 deve incluir as novas classes
- O resumo do pedido deve atualizar

### Solucao

#### A) `ContractStep.tsx` - Tornar classes selecionaveis

Mudancas na interface e logica:

1. Adicionar callback `onSelectedClassesChange` nas props para propagar mudancas ao pai
2. Adicionar callback `onPaymentValueChange` para atualizar o valor exibido
3. Substituir o bloco informativo por checkboxes nativos clicaveis em cada classe nao selecionada
4. Ao marcar uma classe:
   - Chamar `onSelectedClassesChange` com a lista atualizada
   - Recalcular o valor com base no metodo de pagamento (PIX: R$699/classe, Cartao: R$1.194/classe, Boleto: R$1.197/classe)
   - O contrato se regenera automaticamente pois `getProcessedContract()` usa `selectedClasses` via `useCallback`

Visualmente:
- Cada classe tera um checkbox + badge com numero + descricao
- Ao selecionar, mostra o acrescimo de valor (ex: "+R$ 699,00")
- Destaque visual verde para classes recem-adicionadas

#### B) `Registrar.tsx` - Receber mudancas do ContractStep

1. Passar `onSelectedClassesChange={setSelectedClasses}` para o ContractStep
2. Criar funcao `recalculatePaymentValue(classes, method)` que atualiza `paymentValue` quando classes mudam no step 5
3. Passar `onPaymentValueChange={setPaymentValue}` para o ContractStep

#### C) `RegistrationFormSection.tsx` e `RegistrarMarca.tsx` - Mesma logica

Garantir que os outros pontos de entrada do formulario tambem passem os callbacks de mudanca para o ContractStep.

### Detalhes Tecnicos

```text
ContractStep
  |-- props: selectedClasses, suggestedClasses, paymentMethod
  |-- props: onSelectedClassesChange(newList)
  |-- props: onPaymentValueChange(newValue)
  |
  |-- Bloco "Classes sugeridas"
  |     |-- checkbox nativo por classe nao selecionada
  |     |-- ao toggle: chama onSelectedClassesChange
  |     |-- recalcula valor: quantidade * preco_por_metodo
  |     |-- chama onPaymentValueChange
  |
  |-- getProcessedContract() reage automaticamente
  |     (ja depende de selectedClasses no useCallback)
  |
  |-- Resumo do Pedido: "Total" atualiza via paymentValue prop
```

Calculo de valor por metodo:
- `avista` (PIX): R$ 699 por classe
- `cartao6x`: R$ 1.194 por classe
- `boleto3x`: R$ 1.197 por classe

### Arquivos a editar

| Arquivo | Alteracao |
|---------|-----------|
| `ContractStep.tsx` | Adicionar checkboxes clicaveis, callbacks de mudanca, recalculo de valor |
| `Registrar.tsx` | Passar callbacks onSelectedClassesChange e onPaymentValueChange |
| `RegistrationFormSection.tsx` | Passar mesmos callbacks |
| `RegistrarMarca.tsx` | Passar mesmos callbacks |

### Resultado esperado
- No passo do contrato, as classes nao selecionadas aparecem com checkbox
- Ao selecionar uma classe, o valor total atualiza instantaneamente
- A clausula 1.1 do contrato inclui a nova classe automaticamente
- O resumo "Total" no topo reflete o novo valor
- Sem crash ou tela branca (usando checkboxes nativos, sem Radix)
