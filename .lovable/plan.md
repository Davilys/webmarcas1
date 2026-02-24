
## Diagnostico dos Erros

### Erro 1: `/registrar` perde classes da viabilidade vindas do sessionStorage
Em `Registrar.tsx` linhas 96-123, quando carrega dados do `sessionStorage`, o objeto `viabilityResult` e criado **sem** `classes` e `classDescriptions`. Alem disso, nao chama `setSuggestedClasses` / `setSuggestedClassDescriptions` (diferente do `RegistrationFormSection.tsx` que faz corretamente nas linhas 54-66).

**Resultado**: ao chegar de `/` para `/registrar`, as classes sugeridas somem e o BrandDataStep mostra "Classes NCL serao definidas automaticamente".

### Erro 2: `ContractStep.tsx` ainda usa Radix `ScrollArea`
Na linha 176, o contrato usa `<ScrollArea className="h-[360px]">`. Este componente causa o bug de "Maximum update depth exceeded" (loop infinito de refs) quando o conteudo muda dinamicamente. Precisa ser substituido por div nativo com `overflow-y-auto`.

### Erro 3: Contrato nao mostra classes nao selecionadas para upsell
O `ContractStep` recebe apenas `selectedClasses` e `classDescriptions` (das selecionadas), mas nao recebe `suggestedClasses` / `suggestedClassDescriptions` completos. Sem isso, nao e possivel mostrar as classes que o cliente nao selecionou como opcao de upsell.

---

## Plano de Correcao

### A) `src/pages/Registrar.tsx` - Corrigir extracao de classes do sessionStorage

Na secao do `useEffect` (linhas 96-123), adicionar:
- Incluir `classes` e `classDescriptions` no objeto `viabilityResult`
- Chamar `setSuggestedClasses(parsed.classes)` e `setSuggestedClassDescriptions(parsed.classDescriptions || [])` (igual ao `RegistrationFormSection.tsx`)

Codigo atual (linha 102-113):
```typescript
const viabilityResult: ViabilityResult = {
  success: true,
  level: parsed.level,
  title: ...,
  description: '...',
  // FALTA: classes e classDescriptions
};
```

Correcao:
```typescript
const viabilityResult: ViabilityResult = {
  success: true,
  level: parsed.level,
  title: ...,
  description: '...',
  classes: parsed.classes || [],
  classDescriptions: parsed.classDescriptions || [],
};
// + setSuggestedClasses / setSuggestedClassDescriptions
```

### B) `src/components/cliente/checkout/ContractStep.tsx` - Remover ScrollArea

Substituir `<ScrollArea className="h-[360px]">` (linha 176) por `<div className="h-[360px] overflow-y-auto">` para evitar o bug de loop infinito do Radix.

Remover o import de `ScrollArea` (linha 6).

### C) `src/components/cliente/checkout/ContractStep.tsx` - Adicionar props de upsell

Adicionar props opcionais `suggestedClasses` e `suggestedClassDescriptions` a interface `ContractStepProps`. Mostrar um bloco de upsell com as classes nao selecionadas, permitindo que o cliente veja o que esta deixando de proteger.

### D) `src/pages/Registrar.tsx` e `src/components/sections/RegistrationFormSection.tsx` - Passar props de sugestao para ContractStep

Nos dois arquivos, passar `suggestedClasses` e `suggestedClassDescriptions` para `ContractStep` alem de `selectedClasses` e `classDescriptions`.

### E) `src/pages/cliente/RegistrarMarca.tsx` - Mesma correcao

Garantir que o fluxo da area do cliente tambem passe todas as props corretamente para `ContractStep`.

---

## Resumo das alteracoes por arquivo

| Arquivo | Alteracao |
|---------|-----------|
| `Registrar.tsx` | Extrair classes do sessionStorage + passar suggestedClasses para ContractStep |
| `RegistrationFormSection.tsx` | Passar suggestedClasses para ContractStep |
| `RegistrarMarca.tsx` | Passar suggestedClasses para ContractStep |
| `ContractStep.tsx` | Remover ScrollArea, adicionar props de upsell, mostrar classes nao selecionadas |

## Resultado esperado
- Viabilidade na landing -> `/registrar`: classes aparecem no passo "Dados da Marca"
- Viabilidade direta no `/registrar`: classes aparecem normalmente
- Contrato mostra classes selecionadas E lista classes nao selecionadas como sugestao
- Sem crash de tela branca (ScrollArea removido)
