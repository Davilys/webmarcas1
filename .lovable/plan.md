

# Configuracao do Kanban na Area do Cliente

## Objetivo

Adicionar um botao de engrenagem (configuracao) ao Kanban da area do cliente que permite:
- Criar novas etapas do Kanban
- Editar o nome de etapas existentes
- Arrastar etapas para reordenar
- Remover etapas

## Arquitetura

As etapas serao salvas na tabela `system_settings` com a chave `client_kanban_stages`, separada da configuracao do pipeline admin (`processes`). Isso garante independencia entre os dois Kanbans.

## Arquivos a criar/modificar

### 1. Novo componente: `src/components/cliente/ClientKanbanConfig.tsx`

Dialog de configuracao com:
- Botao "+" para adicionar nova etapa (nome + cor)
- Lista de etapas existentes usando `framer-motion` `Reorder.Group` para drag-and-drop vertical
- Cada etapa tera: grip handle para arrastar, campo editavel para nome, seletor de cor, botao de remover
- Salva automaticamente na `system_settings` com chave `client_kanban_stages`
- Reutiliza o mesmo padrao visual do `ProcessSettings.tsx` (ColorSwatches, Reorder.Item)

### 2. Modificar: `src/components/cliente/ClientProcessKanban.tsx`

- Adicionar query para carregar etapas de `system_settings` (chave `client_kanban_stages`)
- Fallback para as colunas hardcoded atuais caso nao haja configuracao salva
- Adicionar botao de engrenagem (icone `Settings2`) no canto superior direito do Kanban
- Ao clicar, abre o `ClientKanbanConfig` dialog
- Ao fechar o dialog, recarrega as etapas

### 3. Modificar: `src/pages/cliente/Processos.tsx`

- Nenhuma alteracao necessaria (o componente Kanban ja e renderizado la)

## Fluxo do usuario

1. Usuario clica no botao Kanban na pagina de processos
2. Ve o Kanban com as colunas configuradas (ou as padrao)
3. Clica no icone de engrenagem
4. No dialog pode: adicionar etapa, editar nome clicando no texto, arrastar para reordenar, remover
5. Alteracoes sao salvas automaticamente
6. Ao fechar o dialog, o Kanban atualiza com a nova configuracao

## Detalhes Tecnicos

- **Persistencia**: Usa `system_settings` tabela existente, chave `client_kanban_stages`, valor JSON `{ stages: [{ id, name, color }] }`
- **RLS**: A tabela `system_settings` so permite acesso a admins. Para que clientes possam ler, sera necessario adicionar uma policy SELECT para usuarios autenticados na chave `client_kanban_stages`, OU carregar as configuracoes via uma abordagem alternativa. Como o Kanban do cliente precisa ler essas configuracoes, adicionaremos uma RLS policy que permite SELECT para qualquer usuario autenticado.
- **Edicao**: Somente admins poderao acessar o botao de configuracao. Clientes verao o Kanban mas sem o botao de engrenagem. Para isso, verificaremos se o usuario tem role `admin` usando a funcao `has_role`.
- **Migracao SQL**: Adicionar policy SELECT na `system_settings` para usuarios autenticados + inserir registro padrao se nao existir.
- **Reorder**: Usa `framer-motion` `Reorder` (ja instalado) para drag-and-drop das etapas no dialog de configuracao.
- **Edicao inline**: Input editavel diretamente na linha da etapa (double-click ou icone de lapis).
- **Cores**: Paleta de cores identica a do `ProcessSettings` com swatches clicaveis.

## Migracao de Banco de Dados

```sql
-- Permitir que usuarios autenticados leiam system_settings
CREATE POLICY "Authenticated users can read system settings"
ON public.system_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Inserir configuracao padrao do kanban do cliente
INSERT INTO public.system_settings (key, value)
VALUES ('client_kanban_stages', '{"stages":[{"id":"em_andamento","name":"Em Andamento","color":"#3B82F6"},{"id":"publicado_rpi","name":"Publicado RPI","color":"#8B5CF6"},{"id":"em_exame","name":"Em Exame","color":"#F59E0B"},{"id":"deferido","name":"Deferido","color":"#10B981"},{"id":"concedido","name":"Concedido","color":"#22C55E"},{"id":"indeferido","name":"Indeferido","color":"#EF4444"},{"id":"arquivado","name":"Arquivado","color":"#6B7280"}]}')
ON CONFLICT (key) DO NOTHING;
```

