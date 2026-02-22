

## Plano: Adicionar DeepSeek e Gemini como provedores de IA com seletor global

### Objetivo

Criar um sistema onde o administrador pode escolher **qual provedor de IA** usar no sistema inteiro (OpenAI/ChatGPT, Gemini ou DeepSeek). Ao ativar um e desativar os outros, **todas as 7 Edge Functions** passam a usar o provedor selecionado automaticamente.

### Como vai funcionar

1. Na tela **Configuracoes > Integracoes**, a secao de IA tera 3 cards:
   - **OpenAI (ChatGPT)** - ja existente, com API Key e seletor de modelo
   - **Google Gemini** - NOVO, com API Key e seletor de modelo (gemini-2.5-flash, gemini-2.5-pro, etc.)
   - **DeepSeek** - NOVO, com API Key e seletor de modelo (deepseek-chat, deepseek-reasoner)

2. **Somente um provedor pode estar ativo por vez**. Ao ativar um, os outros desativam automaticamente.

3. Uma nova configuracao `ai_active_provider` sera salva no `system_settings` com o provedor ativo (`openai`, `gemini`, `deepseek` ou `lovable`).

4. Todas as 7 Edge Functions serao atualizadas para:
   - Consultar `system_settings` para saber qual provedor esta ativo
   - Rotear para a API correta (OpenAI, Gemini via Lovable gateway, ou DeepSeek diretamente)
   - Usar o modelo configurado pelo admin

### Detalhes tecnicos

#### 1. Novas interfaces de configuracao (IntegrationSettings.tsx)

```text
Novos types:
- GeminiSettings { enabled, api_key, model }
- DeepSeekSettings { enabled, api_key, model }
- AIProviderConfig { active_provider: 'openai' | 'gemini' | 'deepseek' | 'lovable' }

Novas system_settings keys:
- 'gemini_config'
- 'deepseek_config'  
- 'ai_active_provider'
```

#### 2. Cards na UI (secao Inteligencia Artificial)

- **Seletor global** no topo: "Provedor de IA Ativo" com radio/select entre OpenAI, Gemini, DeepSeek
- Card **Google Gemini**: switch ativar, API Key (secret input), seletor modelo (gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash), botao testar, botao salvar
- Card **DeepSeek**: switch ativar, API Key (secret input), seletor modelo (deepseek-chat, deepseek-reasoner), botao testar, botao salvar
- Ao ativar Gemini, desativa OpenAI e DeepSeek automaticamente (e vice-versa)

#### 3. Atualizacao das 7 Edge Functions

Cada Edge Function recebera uma funcao auxiliar `getAIConfig()` que:
1. Consulta `system_settings` para `ai_active_provider`, `openai_config`, `gemini_config`, `deepseek_config`
2. Retorna `{ url, model, apiKey, headers }` baseado no provedor ativo
3. Fallback para Lovable AI gateway se nenhum provedor externo estiver configurado

```text
Mapeamento de provedores:
- openai  -> https://api.openai.com/v1/chat/completions (usa OPENAI_API_KEY ou config)
- gemini  -> https://generativelanguage.googleapis.com/v1beta/... (usa API Key do config)  
- deepseek -> https://api.deepseek.com/v1/chat/completions (usa API Key do config)
- lovable -> https://ai.gateway.lovable.dev/v1/chat/completions (usa LOVABLE_API_KEY)
```

Edge Functions afetadas:
| Funcao | Uso |
|--------|-----|
| chat-support | Chat cliente |
| chat-inpi-legal | Chat juridico INPI |
| adjust-inpi-resource | Ajuste de recursos |
| process-rpi | Processamento RPI |
| process-inpi-resource | Geracao de recursos juridicos |
| sync-inpi-knowledge | Enriquecimento de conhecimento |
| email-ai-assistant | Assistente de e-mail IA |

`transcribe-audio` continua usando OpenAI Whisper (unico que suporta transcricao).

#### 4. Secrets necessarios

- **DEEPSEEK_API_KEY** - precisara ser adicionado como secret quando o admin configurar
- **GEMINI_API_KEY** - precisara ser adicionado como secret quando o admin configurar
- As API Keys serao salvas via `system_settings` na UI, e as Edge Functions lerao de la (ou dos secrets do servidor como fallback)

#### 5. Fluxo de teste

Cada card tera botao "Testar Conexao" que invoca `chat-support` com `{ test: true, provider: 'gemini' }` para validar a chave.

### O que NAO sera alterado

- Nenhuma tabela do banco de dados sera criada ou modificada (usa `system_settings` existente)
- Nenhum visual existente sera alterado
- Nenhuma funcionalidade existente sera removida
- Permissoes e RLS permanecem iguais

