
# Plano: Correcoes no Ficheiro do Cliente

## Problema 1: Botoes sobrepostos (X)
Quando o usuario clica em "Email" ou "Detalhes do Processo", aparece o botao "Voltar ao ficheiro" com X, mas o X nativo do Sheet tambem fica visivel, causando sobreposicao. Alem disso, ao clicar em outro botao de acao rapida (ex: Email -> Processo), o usuario precisa primeiro fechar a view atual. O correto e que clicar em qualquer acao rapida automaticamente troque a view ativa.

**Solucao:**
- No `handleQuickAction`, antes de abrir uma nova view inline, fechar automaticamente as outras (ex: ao clicar "Email", fechar `showProcessDetails`; ao clicar "Processo", fechar `showEmailCompose`).
- Adicionar `setShowProcessDetails(false)` antes de `setShowEmailCompose(true)` e vice-versa.

## Problema 2: Botoes de acao faltando em "Detalhes do Processo"
Na view de Detalhes do Processo dentro do ficheiro do cliente (ClientDetailSheet), faltam os botoes que existem no painel lateral da aba Publicacao:
- Editar Datas e Status
- Agenda
- Upload Documento RPI
- Excluir Publicacao

**Solucao:**
- Adicionar, dentro de cada card de publicacao na view de detalhes do processo (ClientDetailSheet, apos a timeline e alertas), os mesmos botoes de acao que existem na PublicacaoTab (linhas 1561-1595).
- Os botoes chamarao dialogs inline para editar datas/status, agendar lembrete, upload de documento e excluir publicacao, tudo dentro do proprio ficheiro.
- Criar estados locais para controlar esses dialogs (`editingPubId`, `showEditPubDialog`, etc.) e implementar as mutacoes correspondentes (update/delete na tabela `publicacoes_marcas` e log na `publicacao_logs`).

## Problema 3: PublicacaoTab - Detalhes devem abrir dentro do ficheiro
Quando o usuario clica num card do Kanban na aba Publicacao e abre o ClientDetailSheet, os botoes de "Editar Datas e Status", "Agenda", "Upload Documento RPI" e "Excluir Publicacao" devem funcionar **dentro do ficheiro** (ClientDetailSheet), nao em dialogs/sheets separados fora dele.

**Solucao:**
- Ja resolvido pelo Problema 2 acima: ao incluir os botoes de acao dentro da view de Detalhes do Processo no ClientDetailSheet, o fluxo fica completo.

---

## Detalhes Tecnicos

### Arquivo: `src/components/admin/clients/ClientDetailSheet.tsx`

1. **Troca automatica de views** (handleQuickAction):
   - Case `'email'`: adicionar `setShowProcessDetails(false)` antes de `setShowEmailCompose(true)`
   - Case `'processo'`: adicionar `setShowEmailCompose(false)` antes de `setShowProcessDetails(true)`
   - Cases `'chat'`, `'move'`, `'notification'`: adicionar `setShowProcessDetails(false); setShowEmailCompose(false)` para voltar ao ficheiro

2. **Botoes de acao em cada publicacao** (dentro do map de `processPublicacoes`, apos os alertas/comentarios):
   - Adicionar novos estados: `editingPubData` (Partial de publicacao sendo editada), `showEditPubDialog`, `deletingPubId`, `showDeletePubConfirm`
   - Botao "Editar Datas e Status": abre Dialog com campos de status, datas (deposito, publicacao RPI, decisao, certificado), tipo de publicacao, cliente, processo, admin, comentarios. Ao salvar, faz update na tabela `publicacoes_marcas` e insere log em `publicacao_logs`.
   - Botao "Agenda": dispara criacao de lembrete no Google Calendar / tabela `client_appointments`
   - Botao "Upload Documento RPI": usa input file hidden, faz upload para storage e atualiza `documento_rpi_url` na publicacao
   - Botao "Excluir Publicacao": abre AlertDialog de confirmacao, deleta da tabela `publicacoes_marcas`

3. **Recarregar dados apos acoes**: apos editar/excluir uma publicacao, re-executar o fetch de `processPublicacoes` para atualizar a view inline.

### Arquivo: `src/components/admin/PublicacaoTab.tsx`
- Nenhuma alteracao necessaria. O painel lateral da PublicacaoTab ja possui os botoes corretos. A correcao e apenas no ClientDetailSheet para espelhar esses botoes.

---

## Arquivos Modificados

| Arquivo | Alteracao |
|---|---|
| `src/components/admin/clients/ClientDetailSheet.tsx` | Troca automatica de views, botoes de acao nas publicacoes (Editar, Agenda, Upload, Excluir), dialogs inline |

## Resultado Esperado
- Clicar em qualquer acao rapida troca a view sem precisar fechar a anterior
- Detalhes do Processo mostra botoes completos (Editar, Agenda, Upload, Excluir) para cada publicacao
- Todas as acoes funcionam dentro do ficheiro, sem abrir novos sheets/paineis externos
