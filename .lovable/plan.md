

## Plano: Corrigir Fluxo de Criação de Cliente e Envio de Credenciais

### Resumo do Problema

Após análise detalhada do código e banco de dados, identifiquei que:

1. **Usuários SÃO criados automaticamente** quando contratos são assinados ✅
2. **Role 'user' É atribuída** corretamente ✅
3. **Área do cliente FUNCIONA** - login via `/cliente/login` ✅
4. **Senha padrão `123Mudar@` está documentada** na tela de login ✅

**PORÉM**, existe um problema crítico no fluxo:

---

### Problema Identificado

| Fluxo | O que acontece | Problema |
|-------|----------------|----------|
| Admin cria contrato para **novo cliente** | `create-client-user` é chamado | Cria usuário com senha **ALEATÓRIA** (não `123Mudar@`) e **NÃO envia email** |
| Cliente assina contrato | `sign-contract-blockchain` verifica se usuário existe | Como já existe, `userCreated = false` e **email de boas-vindas NÃO é enviado** |

**Resultado**: Cliente é criado mas **nunca recebe email com credenciais** e a senha não é `123Mudar@`.

---

### Evidências do Banco de Dados

```text
Últimos emails 'user_created' enviados:
- 2026-01-27: ola@webmarcas.net
- 2026-01-24: davilys@icloud.com  
- 2026-01-13: andreguimel@gmail.com

Contratos assinados recentemente (Feb 2026):
- rafaejg7@gmail.com → assinado em 07/02 → SEM email de boas-vindas
- Jefls2014@gmail.com → assinado em 06/02 → SEM email de boas-vindas
- geneciaraujo94@gmail.com → assinado em 06/02 → SEM email de boas-vindas
```

---

### Arquitetura do Fluxo (Atual vs Desejado)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLUXO ATUAL (COM PROBLEMA)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Admin cria contrato para novo cliente                                   │
│     └─> Chama create-client-user                                           │
│         └─> Cria usuário com senha ALEATÓRIA (não 123Mudar@)               │
│         └─> NÃO envia email de boas-vindas                                 │
│                                                                             │
│  2. Cliente recebe link de assinatura por email                            │
│                                                                             │
│  3. Cliente assina contrato                                                │
│     └─> Chama sign-contract-blockchain                                     │
│         └─> Verifica: usuário já existe? SIM                               │
│         └─> userCreated = false                                            │
│         └─> Email de boas-vindas NÃO enviado                               │
│                                                                             │
│  RESULTADO: Cliente não sabe como acessar área do cliente                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLUXO DESEJADO (CORRIGIDO)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Admin cria contrato para novo cliente                                   │
│     └─> Chama create-client-user                                           │
│         └─> Verifica se cliente já existe                                  │
│         └─> Se novo: cria com senha 123Mudar@                              │
│         └─> NÃO envia email ainda (aguarda assinatura)                     │
│                                                                             │
│  2. Cliente recebe link de assinatura por email                            │
│                                                                             │
│  3. Cliente assina contrato                                                │
│     └─> Chama sign-contract-blockchain                                     │
│         └─> Verifica: usuário já existe? SIM (criado no passo 1)           │
│         └─> NOVO: Verifica se email de boas-vindas já foi enviado          │
│         └─> Se não enviado, envia email com credenciais                    │
│                                                                             │
│  RESULTADO: Cliente recebe credenciais após assinar                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Solução Proposta

#### Opção 1: Corrigir `create-client-user` (Recomendada)

1. Usar senha fixa `123Mudar@` em vez de aleatória
2. Adicionar flag `welcome_email_sent` no profile
3. Enviar email de boas-vindas APENAS após assinatura

#### Opção 2: Corrigir `sign-contract-blockchain`

1. Se usuário já existe mas nunca logou, enviar email de boas-vindas
2. Usar verificação baseada em `last_sign_in_at` do auth.users

---

### Alterações Necessárias

| Arquivo | Ação |
|---------|------|
| `supabase/functions/create-client-user/index.ts` | Modificar - Usar senha `123Mudar@` |
| `supabase/functions/sign-contract-blockchain/index.ts` | Modificar - Sempre enviar email de boas-vindas se usuário existe mas não logou |

---

### Detalhes Técnicos

#### 1. Modificar `create-client-user/index.ts`

**Antes (linha 164):**
```typescript
const tempPassword = generateTempPassword();
```

**Depois:**
```typescript
const tempPassword = '123Mudar@'; // Fixed password - email sent after contract signing
```

#### 2. Modificar `sign-contract-blockchain/index.ts`

Adicionar lógica para enviar email mesmo para usuários existentes que nunca logaram:

```typescript
// Após linha 286 - onde encontra usuário existente
if (existingUser) {
  userId = existingUser.id;
  console.log('Found existing user:', userId);
  
  // NEW: Check if user never logged in (first access pending)
  if (!existingUser.last_sign_in_at) {
    userCreated = true; // Flag to send welcome email
    console.log('User exists but never logged in - will send welcome email');
  }
}
```

---

### Validação Pós-Implementação

1. Criar novo contrato via admin para novo cliente
2. Enviar link de assinatura
3. Assinar contrato
4. Verificar:
   - [ ] Usuário existe no banco
   - [ ] Role 'user' atribuída
   - [ ] Email de boas-vindas enviado com senha `123Mudar@`
   - [ ] Cliente consegue logar em `/cliente/login`

---

### Impacto

| Item | Status |
|------|--------|
| Contratos existentes | Não afetados |
| Usuários existentes | Não afetados (já têm senha) |
| Novos contratos | Receberão email após assinatura |
| Edge functions | Atualização automática |

