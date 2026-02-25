

## Composicao de Email Inline no Ficheiro do Cliente

### Problema Atual

Ao clicar no botao "Email" (quick action) ou no link do email na aba Contatos, o sistema navega para `/admin/emails?compose=true`, saindo completamente do ficheiro do cliente. O usuario perde o contexto e precisa voltar manualmente.

### Solucao

Abrir o componente `EmailCompose` **dentro do proprio ficheiro** (ClientDetailSheet), em um Dialog/overlay, sem sair da ficha. O email sera enviado pela conta atribuida ao administrador logado (via `email_accounts.assigned_to`).

### Alteracoes

#### Arquivo: `src/components/admin/clients/ClientDetailSheet.tsx`

**1. Adicionar estados para controlar o compose inline**

```text
const [showEmailCompose, setShowEmailCompose] = useState(false);
const [adminEmailAccount, setAdminEmailAccount] = useState<{ id: string; email_address: string } | null>(null);
```

**2. Buscar a conta de email do admin logado no `fetchClientData`**

Adicionar uma query para buscar a conta de email atribuida ao usuario logado:

```text
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const { data: emailAcc } = await supabase
    .from('email_accounts')
    .select('id, email_address')
    .eq('assigned_to', user.id)
    .limit(1)
    .maybeSingle();
  
  // Fallback: se nao tem conta atribuida, buscar a default
  if (!emailAcc) {
    const { data: defaultAcc } = await supabase
      .from('email_accounts')
      .select('id, email_address')
      .eq('is_default', true)
      .maybeSingle();
    setAdminEmailAccount(defaultAcc);
  } else {
    setAdminEmailAccount(emailAcc);
  }
}
```

**3. Alterar o `handleQuickAction` para "email"**

Em vez de `window.location.href = ...`, abrir o compose inline:

```text
case 'email':
  if (client?.email) setShowEmailCompose(true);
  else toast.error('Cliente sem e-mail cadastrado');
  break;
```

**4. Alterar o link de email na aba Contatos**

Na `InfoRow` do email (linha 858), em vez de `link={mailto:...}`, adicionar um handler que abre o compose inline. Isso requer modificar o `InfoRow` para aceitar um `onClick` opcional, ou trocar o `link` por um botao customizado.

Abordagem: Adicionar prop `onAction` ao `InfoRow`. Quando presente, o botao de acao externa chama `onAction` em vez de abrir o link.

**5. Renderizar o EmailCompose em um Dialog**

Adicionar um `Dialog` no final do componente que renderiza o `EmailCompose` completo:

```text
<Dialog open={showEmailCompose} onOpenChange={setShowEmailCompose}>
  <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden">
    <EmailCompose
      onClose={() => setShowEmailCompose(false)}
      initialTo={client.email}
      initialName={client.full_name || ''}
      accountId={adminEmailAccount?.id || null}
      accountEmail={adminEmailAccount?.email_address}
    />
  </DialogContent>
</Dialog>
```

Isso reutiliza 100% do componente EmailCompose existente (com templates processuais, variaveis dinamicas, preview, anexos, IA) sem duplicar logica.

**6. Importar o EmailCompose**

Adicionar no topo:

```text
import { EmailCompose } from '@/components/admin/email/EmailCompose';
```

### Seguranca

- Nenhuma tabela alterada
- Nenhum schema modificado
- Nenhuma Edge Function alterada
- O EmailCompose ja valida autenticacao antes de enviar
- A conta de email e determinada automaticamente pelo `assigned_to` do admin logado
- O ficheiro do cliente continua aberto durante e apos o envio
- Nenhum fluxo existente e quebrado (a pagina /admin/emails continua funcionando normalmente)

### Arquivos a Editar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/admin/clients/ClientDetailSheet.tsx` | Adicionar Dialog com EmailCompose inline, buscar conta de email do admin, alterar quick action e link do email |

### Resultado Esperado

- Ao clicar em "Email" (quick action) ou no icone do email na aba Contatos, abre um Dialog com o compositor de email completo
- O destinatario ja vem preenchido com o email do cliente
- O remetente usa a conta de email atribuida ao admin logado pelo admin master
- Todas as funcionalidades do EmailCompose ficam disponiveis (templates processuais, variaveis dinamicas, preview, anexos, IA)
- O ficheiro do cliente permanece aberto por tras do Dialog
- Apos enviar, o Dialog fecha e o usuario continua na ficha do cliente

