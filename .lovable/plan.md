

## Plano: Resolver Bloqueio de Emails como Spam - Migrar para Resend

### Diagnóstico do Problema

O email `juridico@webpatentes.com.br` está sendo bloqueado pela Hostinger por "atividades suspeitas" (erro 550). Isso ocorre porque:

| Causa | Explicação |
|-------|------------|
| Volume de envio | Servidores de hospedagem compartilhada limitam envios diarios (geralmente 100-500/dia) |
| Falta de SPF/DKIM | O dominio pode nao ter registros DNS de autenticacao configurados corretamente |
| IP compartilhado | O IP do servidor SMTP da Hostinger e usado por muitos clientes, o que degrada a reputacao |
| Conteudo repetitivo | Emails automatizados com templates similares podem ser flagados como spam |

### Por que empresas nao tem esse problema?

Empresas que enviam notificacoes usam servicos especializados de email transacional como:
- Resend
- SendGrid
- Mailgun
- Amazon SES

Esses servicos possuem:
- IPs dedicados com alta reputacao
- Autenticacao SPF/DKIM/DMARC automatica
- Infraestrutura otimizada para deliverability

### Solucao Proposta: Migrar para Resend

Resend e um servico profissional de email transacional que resolve todos os problemas mencionados.

#### Vantagens
- Entrega garantida (99%+ deliverability)
- SPF/DKIM automatico
- Dashboard com metricas de entrega
- Plano gratuito: 3.000 emails/mes
- Plano Pro: $20/mes por 50.000 emails

---

### Etapas de Implementacao

#### 1. Criar conta no Resend
O usuario deve acessar https://resend.com e criar uma conta.

#### 2. Verificar dominio
Acessar https://resend.com/domains e adicionar o dominio `webpatentes.com.br` (ou `webmarcas.net`).
O Resend fornecera registros DNS (SPF, DKIM, DMARC) que devem ser adicionados no painel da Hostinger.

#### 3. Gerar API Key
Acessar https://resend.com/api-keys e criar uma chave com escopo para o dominio verificado.

#### 4. Configurar secret no sistema
Adicionar a secret `RESEND_API_KEY` no backend do projeto.

#### 5. Atualizar Edge Functions
Modificar as funcoes de envio de email para usar a API do Resend em vez de SMTP direto.

---

### Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/send-email/index.ts` | Reescrever para usar Resend API |
| `supabase/functions/trigger-email-automation/index.ts` | Reescrever para usar Resend API |
| Adicionar secret `RESEND_API_KEY` | Necessario para autenticacao |

---

### Detalhes Tecnicos

#### Nova implementacao do send-email

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Enviar email via API Resend
const { data, error } = await resend.emails.send({
  from: "Juridico WebMarcas <juridico@webpatentes.com.br>",
  to: [recipientEmail],
  subject: subject,
  html: htmlContent,
});
```

---

### Consideracoes de Custos

| Plano | Emails/mes | Custo |
|-------|------------|-------|
| Free | 3.000 | Gratuito |
| Pro | 50.000 | $20/mes |
| Business | 100.000 | $45/mes |

Para o volume atual do sistema (estimado em ~100-200 emails/mes), o plano gratuito e suficiente.

---

### Proximos Passos

1. Criar conta no Resend
2. Verificar o dominio webpatentes.com.br (ou webmarcas.net)
3. Me informar a API Key para configurarmos no sistema
4. Implementar as alteracoes nas Edge Functions

**Posso comecar a implementacao assim que voce fornecer a API Key do Resend?**

