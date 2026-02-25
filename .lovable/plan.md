
# Correcao: Dois paineis abrindo simultaneamente na aba Publicacoes

## Problema
Ao clicar num card do Kanban na aba Revista INPI > Publicacoes, duas coisas acontecem ao mesmo tempo:
1. O painel lateral branco "Detalhes do Processo" aparece no lado direito (dentro da pagina)
2. O ficheiro azul (ClientDetailSheet) abre por cima como Sheet

Resultado: o painel branco mostra as informacoes corretas (timeline, botoes), mas o ficheiro azul mostra "Detalhes do Processo" vazio/em branco. Sao dois paineis sobrepostos.

## Solucao
Mudar o fluxo para que ao clicar num card do Kanban:
- Abra APENAS o ficheiro azul (ClientDetailSheet) com `initialShowProcessDetails=true`
- O painel lateral branco NAO apareca (fechar `selectedId` para o painel lateral ao abrir o sheet)
- As informacoes do processo (timeline, botoes Editar/Agenda/Upload/Excluir) fiquem DENTRO do ficheiro azul

## Detalhes Tecnicos

### Arquivo: `src/components/admin/PublicacaoTab.tsx`

**1. No handler do Kanban `onSelect` (linha ~1358-1362):**
- Ao abrir o ClientDetailSheet, limpar o `selectedId` do painel lateral para que ele nao apareca
- Guardar o ID selecionado apenas para construir o `selectedClientForSheet`
- Adicionar `setShowProcessDetailFromSheet(true)` para que o ficheiro azul abra ja com "Detalhes do Processo" visivel

Antes:
```
onSelect={id => {
  setSelectedId(id);
  setShowClientSheet(true);
}}
```

Depois:
```
onSelect={id => {
  setSelectedId(id);
  setSelectedId(null);  // Fecha painel lateral branco
  setShowClientSheet(true);
  setShowProcessDetailFromSheet(true);
}}
```

Na pratica, vamos guardar o id num estado separado (ex: `sheetPubId`) para construir o `selectedClientForSheet`, sem ativar o painel lateral. Ou simplesmente limpar `selectedId` apos construir o client, usando um `useEffect`.

**Abordagem mais limpa:** Usar o `selectedId` apenas para o painel lateral (quando NAO abre o sheet). Quando abre o sheet, usar um estado separado `sheetSelectedPubId` para construir o client:

- Criar estado `sheetSelectedPubId`
- No Kanban onSelect: setar `sheetSelectedPubId`, abrir sheet, NAO setar `selectedId`
- O `selectedClientForSheet` usa `sheetSelectedPubId` em vez de `selectedId`
- O painel lateral branco continua usando `selectedId` (que ficara null quando o sheet estiver aberto)

**2. Na lista (view modo lista, linhas ~1395-1440):**
- Manter o mesmo comportamento: ao clicar numa linha, abrir sheet e nao o painel lateral

**3. No render do painel lateral (linhas ~1470-1660):**
- Condicionar para NAO renderizar quando `showClientSheet` esta aberto

### Arquivo: `src/components/admin/clients/ClientDetailSheet.tsx`
- Nenhuma alteracao necessaria. O `initialShowProcessDetails=true` ja funciona e o `handleQuickAction('processo')` ja busca os dados corretamente.

## Resultado Esperado
- Clicar no card do Kanban abre APENAS o ficheiro azul (ClientDetailSheet) com Detalhes do Processo preenchido
- Painel lateral branco nao aparece mais simultaneamente
- Todas as informacoes e botoes (Editar, Agenda, Upload, Excluir) ficam dentro do ficheiro azul
