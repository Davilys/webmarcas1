

## Correção: Link "Continuar Registro" no email abrindo no Lovable em vez de webmarcas.net

### Problema

Na linha 107 do arquivo `src/components/sections/RegistrationFormSection.tsx`, o campo `base_url` é enviado como `window.location.origin`. Quando o formulário é preenchido no ambiente de preview do Lovable, o link no email aponta para `https://...lovable.app/registro` em vez de `https://webmarcas.net/registro`.

O mesmo padrão ruim pode afetar SMS e WhatsApp, pois o link repassado ao multicanal herda o mesmo domínio.

### Solução

Trocar `window.location.origin` por uma lógica que prioriza o domínio de produção, seguindo o mesmo padrão já usado em todas as Edge Functions:

**Arquivo: `src/components/sections/RegistrationFormSection.tsx` (linha 107)**

```
Antes:
  base_url: window.location.origin,

Depois:
  base_url: 'https://webmarcas.net',
```

Usar o domínio fixo de produção garante que o email, SMS e WhatsApp sempre apontem para o domínio correto, independente de onde o formulário foi preenchido (preview Lovable, localhost ou produção).

### Verificação adicional

O template do email `form_started` no banco de dados já usa `{{app_url}}/registro` corretamente. A Edge Function `trigger-email-automation` já tem proteção anti-preview (linhas 58-64), mas como `data.base_url` é preenchido com `window.location.origin` ANTES da proteção ser aplicada, o domínio do preview acaba passando. Fixando no frontend resolve de forma definitiva.

### Impacto

- Nenhuma tabela alterada
- Nenhum schema modificado
- Apenas 1 linha alterada no frontend
- Nenhuma Edge Function precisa ser editada (a proteção anti-preview na trigger-email já existe, mas o frontend estava enviando o domínio errado antes dela ser verificada)
- SMS e WhatsApp herdam a correção automaticamente

