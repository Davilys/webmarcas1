
# Processos (Pipeline) — Configurações: Redesign Premium

## O que essa aba faz (importante manter)

A aba **Processos** configura as **etapas do pipeline jurídico INPI** — os estágios que aparecem no:
- Kanban de processos do cliente (`/cliente/processos` → aba Kanban)
- Página de Processos do admin (`/admin/processos`)
- Revista INPI ao mover um processo para uma nova etapa
- Detalhe do processo do cliente (`/cliente/processos/:id`)

Ou seja: **é uma configuração central e importante**. O problema é que a UI atual está quebrada (nomes das etapas não aparecem — fundo preto sobre fundo escuro) e muito básica. Deve ser mantida e modernizada.

## Diagnóstico do bug atual

O `<Reorder.Item>` tem `bg-card` mas o `<span>` com o nome da etapa não tem cor de texto definida, resultando em texto invisível sobre fundo escuro no tema dark. Além disso, o `<input type="color">` nativo fica como um quadrado preto sem estilo.

## Solução: Redesign Premium do ProcessSettings

### 1. Visual pipeline preview (novo)
Adicionar uma faixa horizontal no topo do card mostrando as etapas como "chips" conectados por setas — igual a um funil visual. Isso dá contexto imediato de como as etapas se encadeiam.

### 2. Itens do Reorder redesenhados
Cada etapa na lista passa a ter:
- **Nome visível** com `text-foreground` explícito
- **Barra colorida** lateral à esquerda (estilo HUD, igual ao sidebar de Configurações)
- **Badge de índice** (01, 02, 03...) indicando posição no pipeline
- **Swatches de cor** substituem o `<input type="color">` nativo — paleta de 9 cores clicável
- **Chip de preview** da cor selecionada com o nome da etapa
- Fundo com glassmorphism e borda colorida dinâmica baseada na cor da etapa

### 3. Dialog "Nova Etapa" modernizado
- Preview em tempo real da etapa enquanto o usuário digita o nome
- Swatches de cores com animação de seleção (ring + scale)
- Nome gerado automaticamente como badge de preview antes de adicionar

### 4. Estado vazio premium
Quando não há etapas, mostrar um estado visual com ícone animado e call-to-action para adicionar a primeira etapa.

### 5. Auto-save ao reordenar
Após soltar (drag end), salvar automaticamente a nova ordem sem precisar clicar no botão "Salvar" manualmente — feedback toast instantâneo.

## Arquivos a modificar

### `src/components/admin/settings/ProcessSettings.tsx`
Reescrever o componente com o novo design premium:
- Corrigir `text-foreground` nos nomes das etapas
- Pipeline preview visual horizontal
- Reorder items com glassmorphism + borda colorida + badge de índice
- Swatches de cor inline (sem `<input type="color">` nativo)
- Dialog modernizado com preview em tempo real
- Auto-save no reorder
- Estado vazio com animação

## Resultado esperado

- Nomes das etapas **visíveis** e legíveis em todos os temas
- Interface premium alinhada com a identidade visual "Futurista 2026"
- Pipeline preview que dá contexto imediato do que está sendo configurado
- Experiência de drag-and-drop refinada com auto-save
- Sem perda de funcionalidade — as etapas continuam sendo salvas na `system_settings` e usadas em todo o sistema
