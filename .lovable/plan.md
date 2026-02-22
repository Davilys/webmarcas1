

# Gerenciamento Completo de API Keys nas Configuracoes de Integracoes

## Resumo

Expandir a secao "Integracoes" nas configuracoes do admin para incluir **todas** as API Keys usadas no sistema, organizadas por categoria, com opcao de editar, salvar e testar cada uma.

## Integracoes Identificadas no Sistema

### Ja existentes na interface (manter e melhorar):
1. **Asaas** -- Gateway de Pagamentos (PIX, Boleto, Cartao) -- **Falta campo para editar a API Key diretamente**
2. **Resend** -- E-mail Transacional
3. **BotConversa** -- WhatsApp
4. **Zenvia** -- SMS
5. **OpenAI (ChatGPT)** -- IA para chat, e-mails, recursos INPI, transcricao
6. **INPI** -- Monitoramento de Marcas

### Faltando na interface (adicionar):
7. **Firecrawl** -- Web Scraping para viabilidade de marca
8. **Lovable AI** -- IA interna (Gemini/GPT-5) usada em viabilidade, documentos, notificacoes
9. **Perfex CRM** -- Integracao com CRM externo (sincronizacao de projetos)

## Mudancas Tecnicas

### Arquivo: `src/components/admin/settings/IntegrationSettings.tsx`

**1. Novos types:**
```text
FirecrawlSettings { enabled: boolean; api_key: string; }
LovableAISettings { enabled: boolean; }
PerfexSettings { enabled: boolean; api_url: string; api_token: string; }
```

**2. Card do Asaas -- Adicionar campo de API Key:**
- Adicionar campo `SecretInput` para editar a API Key do Asaas diretamente pela interface
- Adicionar novo campo `api_key` no `AsaasSettings` type
- Manter opcao de ambiente (sandbox/producao)
- Quando salvo, o valor fica em `system_settings` (chave `asaas`) e as edge functions podem ler de la alem do secret do servidor

**3. Card OpenAI -- Melhorar:**
- Adicionar botao "Testar Conexao" que chama a API de models
- Listar servicos dependentes: Chat Suporte, Assistente de E-mail, Recursos INPI, Transcricao de Audio, Analise RPI, Chat Juridico INPI
- Melhorar descricao

**4. Novo Card -- Firecrawl (Web Scraping):**
- Icone: `Globe` (laranja)
- Campo: API Key editavel
- Toggle: Ativar/Desativar
- Descricao: "Usado para busca de viabilidade de marca (scraping de sites do INPI)"
- StatusBadge

**5. Novo Card -- Lovable AI:**
- Icone: `Sparkles` (roxo)
- Informativo: chave auto-provisionada pelo sistema
- Toggle: Ativar/Desativar
- Descricao: "IA integrada para viabilidade de marca, extracao de documentos e notificacoes multicanal"
- StatusBadge mostrando "Configurado automaticamente"

**6. Novo Card -- Perfex CRM:**
- Icone: `FolderSync` (azul)
- Campo: URL da API (`PERFEX_API_URL`)
- Campo: Token da API (`PERFEX_API_TOKEN`)
- Toggle: Ativar/Desativar
- Descricao: "Sincronizacao de projetos e clientes com Perfex CRM externo"
- StatusBadge

**7. Novos hooks `useSystemSetting`:**
- `firecrawl_config` para Firecrawl
- `lovable_ai_config` para Lovable AI
- `perfex_config` para Perfex CRM
- Adicionar `api_key` ao `asaas` existente

**8. Organizacao dos cards (ordem):**
- Pagamentos: Asaas
- Comunicacao: Resend, BotConversa, Zenvia SMS
- Inteligencia Artificial: OpenAI, Lovable AI, Firecrawl
- Sistemas Externos: Perfex CRM, INPI

**9. Novos icones (importar de lucide-react):**
- `Sparkles` para Lovable AI
- `Globe` para Firecrawl
- `FolderSync` para Perfex CRM

### Nenhuma mudanca em banco de dados
- Os novos settings serao criados automaticamente pelo `upsert` na tabela `system_settings` quando o admin salvar pela primeira vez

### Nenhuma mudanca em edge functions
- As edge functions continuam lendo as API keys dos secrets do servidor (`Deno.env.get`)
- Os campos na interface servem para o admin ter visibilidade e poder atualizar os valores pelo painel

