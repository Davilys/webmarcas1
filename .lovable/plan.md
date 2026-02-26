
# Atribuir Cliente na Ficha do Processo (Publicacao)

## Objetivo
Adicionar um campo "Atribuir ao Cliente" diretamente no painel de detalhes do processo (lado direito), ao lado do responsavel admin, com busca autocomplete de todos os clientes. Ao selecionar o cliente, a publicacao e sincronizada automaticamente com o painel do cliente.

## O que sera feito

### 1. Campo "Atribuir ao Cliente" no painel de detalhes
- Adicionar um campo de busca com autocomplete logo abaixo do responsavel admin no painel lateral direito (linhas ~1562-1566 do PublicacaoTab.tsx)
- Ao digitar o nome, aparece uma lista dropdown com todos os clientes filtrados
- Exibe nome, email e CPF/CNPJ para facilitar a identificacao
- Botao X para desvincular o cliente
- Se ja houver cliente vinculado, mostra o nome com indicador visual

### 2. Logica de atribuicao ao selecionar cliente
Quando um cliente e selecionado:
- Atualiza `client_id` na tabela `publicacoes_marcas`
- Se a publicacao tem `process_id`, atualiza `user_id` do `brand_processes` para o cliente selecionado (sincroniza o processo)
- Registra a alteracao na tabela `publicacao_logs` (auditoria)
- Envia notificacao ao cliente informando que um processo foi vinculado

### 3. Sincronizacao automatica com o painel do cliente
A sincronizacao ja funciona hoje atraves das queries existentes:
- **Processos**: O painel do cliente (`/cliente/processos`) busca `brand_processes` por `user_id` -- ao atualizar o `user_id`, o processo aparece automaticamente
- **Publicacoes**: O componente `PublicacoesCliente` busca `publicacoes_marcas` por `client_id` -- ao atualizar o `client_id`, a publicacao aparece automaticamente
- **Documentos**: Documentos vinculados ao `process_id` ja sao exibidos no painel do cliente via query por `process_id`
- **Status**: O status do pipeline e sincronizado bidirecionalmente entre `publicacoes_marcas.status` e `brand_processes.pipeline_stage` (ja implementado no `updateMutation`)

---

## Detalhes tecnicos

### Arquivo modificado: `src/components/admin/PublicacaoTab.tsx`

**Novo estado**:
- `clientAssignSearch: string` -- texto de busca
- `showClientAssignDropdown: boolean` -- controle do dropdown

**Novo componente inline** no painel de detalhes (apos linha 1565):
- Input com icone de busca
- Dropdown com lista de clientes filtrados (max 8)
- Cada item mostra nome + email
- Ao clicar, chama uma nova mutation que:
  1. Atualiza `publicacoes_marcas.client_id`
  2. Se `process_id` existe, atualiza `brand_processes.user_id` para o mesmo cliente
  3. Registra log na `publicacao_logs`
  4. Insere notificacao para o cliente

**Nova mutation `assignClientMutation`**:
```text
1. UPDATE publicacoes_marcas SET client_id = X WHERE id = Y
2. UPDATE brand_processes SET user_id = X WHERE id = process_id (se existir)
3. INSERT publicacao_logs (campo: client_id, valor anterior, valor novo)
4. INSERT notifications (titulo: Processo vinculado)
```

### Nenhuma alteracao de banco de dados necessaria
Todas as colunas e tabelas necessarias ja existem:
- `publicacoes_marcas.client_id`
- `brand_processes.user_id`
- `publicacao_logs`
- `notifications`
