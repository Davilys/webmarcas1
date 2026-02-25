

## Plano: Google Meet na Aba "Agenda" do ClientDetailSheet

### Contexto

O usuario quer que a geracao de link Google Meet aconteca na **aba "Agenda"** dentro do contato do cliente (`ClientDetailSheet.tsx`), e nao apenas no chat. Atualmente a aba Agenda usa a tabela `client_appointments` que **nao possui** campo para link do Meet.

Existem **dois pontos de agendamento** no sistema:
1. **Aba Agenda no contato do cliente** (`ClientDetailSheet.tsx`) -- usa `client_appointments`
2. **Chat de Suporte** (`MeetingScheduleDialog.tsx`) -- usa `meetings`

A integracao com Google Meet sera aplicada em **ambos**.

---

### 1. Migracao de Banco de Dados

Adicionar colunas nas duas tabelas de agendamento:

```text
client_appointments:
  + google_meet_link TEXT
  + google_event_id TEXT

meetings:
  + google_meet_link TEXT
  + google_event_id TEXT
```

### 2. Configurar Credenciais Google

Os seguintes secrets **precisam ser adicionados** (nenhum existe hoje):

- **GOOGLE_CLIENT_ID** -- OAuth 2.0 do Google Cloud Console
- **GOOGLE_CLIENT_SECRET** -- OAuth 2.0 do Google Cloud Console
- **GOOGLE_REFRESH_TOKEN** -- obtido via fluxo OAuth offline da conta admin

Sera solicitado durante a implementacao.

### 3. Criar Edge Function `create-google-meet`

Nova funcao backend que:
- Recebe titulo, horario, duracao e emails dos participantes
- Usa Refresh Token para obter Access Token via Google OAuth
- Cria evento no Google Calendar com `conferenceDataVersion: 1` (Meet automatico)
- Retorna o `meetLink` e `eventId`
- Funciona como servico independente chamado por qualquer componente

Tratamento de erros:
- Se credenciais nao configuradas, retorna erro claro sem quebrar o fluxo
- Se API Google falhar, o agendamento permanece salvo sem link (fallback gracioso)

### 4. Atualizar `ClientDetailSheet.tsx` -- Aba Agenda

Mudancas no formulario "Novo Agendamento":
- Adicionar toggle/switch "Gerar Google Meet" (ativo por padrao)
- Adicionar campo de duracao (30, 60, 90 min)
- Apos salvar no banco, se toggle ativo, chamar a Edge Function `create-google-meet`
- Atualizar o registro em `client_appointments` com `google_meet_link` e `google_event_id`
- Exibir o link gerado com botao de copiar

Na listagem de agendamentos:
- Se `google_meet_link` existir, exibir botao "Entrar na Reuniao" com icone de video
- Botao abre o link em nova aba

### 5. Atualizar `MeetingScheduleDialog.tsx` -- Chat

Mudancas analogas:
- Adicionar toggle "Gerar Google Meet"
- Apos salvar na tabela `meetings`, chamar a Edge Function
- Atualizar o registro com link e event ID
- Incluir link na mensagem automatica do chat

### 6. Atualizar `ChatMessageBubble.tsx`

- Detectar mensagens com link do Google Meet
- Renderizar botao estilizado "Entrar na Reuniao" com icone

### 7. Registrar funcao no config

Adicionar em `supabase/config.toml`:
```text
[functions.create-google-meet]
verify_jwt = true
```

---

### Fluxo Final (Aba Agenda)

1. Admin abre contato do cliente -> aba "Agenda"
2. Clica "Novo Agendamento", preenche titulo/data/hora/duracao
3. Toggle "Gerar Google Meet" esta ativo
4. Clica "Criar Agendamento"
5. Sistema salva no `client_appointments` -> chama Edge Function -> Google cria evento com Meet
6. Link salvo no banco e exibido na listagem
7. Admin pode copiar ou clicar para entrar

### Fluxo Final (Chat)

1. Admin ou cliente abre dialog de reuniao no chat
2. Preenche dados e ativa "Gerar Google Meet"
3. Sistema salva em `meetings` -> chama Edge Function
4. Link incluido na mensagem automatica do chat
5. Ambos veem botao "Entrar na Reuniao"

---

### Pre-requisito

As 3 credenciais Google serao solicitadas ao usuario antes da implementacao funcionar.

