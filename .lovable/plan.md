
# Correcao do Erro de Tela Branca -- CreateContractDialog

## Causa Raiz Identificada

Dois bugs combinados causam o crash:

### Bug 1: Dialog sem `forceMount`
O arquivo `src/components/ui/dialog.tsx` perdeu a propriedade `forceMount` que havia sido aplicada anteriormente para evitar crashes do Radix UI. Sem `forceMount`, o componente `Presence` interno do Radix tenta remover nos DOM que ja foram removidos, gerando o erro:
```text
Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
```
Isso causa a tela preta/branca ao abrir o dialog.

### Bug 2: Duplo disparo do toggle de classes
No card de selecao de classes (linhas 1605-1633), o `<div>` pai tem `onClick={toggleClassSelection}` e o `<Checkbox>` filho tem `onCheckedChange={toggleClassSelection}`. Quando o usuario clica no checkbox, o evento dispara DUAS vezes (uma no checkbox, outra via bubbling no div), fazendo a classe ser selecionada e imediatamente desmarcada, causando atualizacoes de estado rapidas que intensificam o crash do Radix.

## Correcoes

### Arquivo 1: `src/components/ui/dialog.tsx`
- Adicionar `forceMount` ao `DialogPortal`, `DialogOverlay`, e `DialogPrimitive.Content`
- Isso forca os componentes a ficarem sempre montados no DOM, evitando que o Radix Presence tente remover/adicionar nos durante animacoes

### Arquivo 2: `src/components/admin/contracts/CreateContractDialog.tsx`
- Remover o `onClick` do `<div>` pai que envolve cada classe
- Manter apenas o `onCheckedChange` no `<Checkbox>` como unico ponto de interacao
- Alternativa: manter o `onClick` no div mas adicionar `e.stopPropagation()` no checkbox, ou remover `onCheckedChange` do checkbox e deixar apenas o div controlando

## Arquivos Modificados
| Arquivo | Alteracao |
|---|---|
| `src/components/ui/dialog.tsx` | Adicionar `forceMount` em Portal, Overlay e Content |
| `src/components/admin/contracts/CreateContractDialog.tsx` | Corrigir duplo disparo do toggle de classes |

## O que NAO sera alterado
- Nenhuma logica de negocio
- Nenhum calculo de valores
- Nenhum layout visual
- Nenhuma tabela ou edge function
- Nenhum outro componente
