
## Correção: Exibir e Editar Dados Completos do Cliente na Aba Contatos

### Problema Identificado
Na aba **Contatos** do painel de detalhes do cliente:
1. O **CPF** exibe `client.cpf` ou `client.cpf_cnpj`, mas a interface `ClientWithProcess` não inclui o campo `cpf` separadamente
2. O **CNPJ** exibe `(client as any).cnpj` que também não está na interface
3. O endereço só é exibido **se existir no profileData**, mas o profileData não busca cpf/cnpj
4. No formulário de edição, os campos são inicializados com dados incompletos da interface `ClientWithProcess`

### Causa Raiz
A tabela `profiles` possui colunas `cpf`, `cnpj`, `address`, `neighborhood`, `city`, `state`, `zip_code`, mas:
- A query em `fetchClientData()` (linha 274) só busca: `address, neighborhood, city, state, zip_code`
- A interface `ClientWithProcess` não contém `cpf` ou `cnpj` como campos separados
- O `editFormData` é inicializado com dados parciais

### Solução Proposta (Isolada e Segura)

#### 1. Ampliar a Query do `profileData` para incluir CPF e CNPJ
**Arquivo:** `src/components/admin/clients/ClientDetailSheet.tsx`

**Alteração na linha ~274:**
```typescript
// Antes:
supabase.from('profiles').select('address, neighborhood, city, state, zip_code').eq('id', client.id).maybeSingle()

// Depois:
supabase.from('profiles').select('cpf, cnpj, company_name, address, neighborhood, city, state, zip_code').eq('id', client.id).maybeSingle()
```

#### 2. Atualizar a Interface `profileData` State
**Linha ~212-220:**
```typescript
// Antes:
const [profileData, setProfileData] = useState<{
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
} | null>(null);

// Depois:
const [profileData, setProfileData] = useState<{
  cpf?: string;
  cnpj?: string;
  company_name?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
} | null>(null);
```

#### 3. Usar `profileData` na Aba Contatos (ao invés de `client`)
**Linhas ~992-993 (CPF):**
```typescript
// Antes:
<p className="font-medium font-mono">{(client as any).cpf || client.cpf_cnpj || 'N/A'}</p>

// Depois:
<p className="font-medium font-mono">{profileData?.cpf || client.cpf_cnpj || 'N/A'}</p>
```

**Linhas ~1052-1054 (CNPJ):**
```typescript
// Antes:
<p className="font-medium font-mono">
  {(client as any).cnpj || 'N/A'}
</p>

// Depois:
<p className="font-medium font-mono">
  {profileData?.cnpj || 'N/A'}
</p>
```

**Linha ~1048 (Razão Social):**
```typescript
// Antes:
<p className="font-medium">{client.company_name || 'N/A'}</p>

// Depois:
<p className="font-medium">{profileData?.company_name || client.company_name || 'N/A'}</p>
```

#### 4. Inicializar `editFormData` corretamente com dados do `profileData`
**Linhas ~283-293:**
```typescript
// Atualizar para incluir cpf, cnpj e company_name
if (profileRes.data) {
  setEditFormData(prev => ({
    ...prev,
    cpf: profileRes.data.cpf || '',
    cnpj: profileRes.data.cnpj || '',
    company_name: profileRes.data.company_name || client.company_name || '',
    address: profileRes.data.address || '',
    neighborhood: profileRes.data.neighborhood || '',
    city: profileRes.data.city || '',
    state: profileRes.data.state || '',
    zip_code: profileRes.data.zip_code || ''
  }));
}
```

#### 5. Remover inicialização incorreta de `cpf/cnpj` no useEffect
**Linhas ~241-252:**
```typescript
// Remover a inicialização incorreta que usa (client as any).cpf
// Deixar a inicialização completa ser feita no callback do fetchClientData
setEditFormData({
  full_name: client.full_name || '',
  email: client.email || '',
  phone: client.phone || '',
  cpf: '',      // Será preenchido pelo profileData
  cnpj: '',     // Será preenchido pelo profileData
  company_name: client.company_name || '',
  address: '',
  neighborhood: '',
  city: '',
  state: '',
  zip_code: '',
  priority: client.priority || 'medium',
  origin: client.origin || 'site'
});
```

---

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/clients/ClientDetailSheet.tsx` | Query ampliada, interface state, exibição na aba Contatos, inicialização do formulário de edição |

---

### Análise de Risco

| Risco | Mitigação |
|-------|-----------|
| Quebrar exibição se profileData for null | Usar fallback para `client.cpf_cnpj` e 'N/A' |
| Sobrescrever dados do cliente durante edição | A função `handleSaveFullEdit()` já está correta, atualizando cpf, cnpj, company_name separadamente |
| Regressão em outros componentes | Alteração isolada apenas no `ClientDetailSheet`, não afeta `ClientKanbanBoard` ou `Clientes.tsx` |

---

### Comportamento Esperado Após Correção

1. **Aba Contatos**
   - CPF exibe valor correto do banco (`profileData.cpf`)
   - CNPJ exibe valor correto do banco (`profileData.cnpj`)
   - Razão Social exibe `company_name` do banco
   - Endereço completo exibe todos os campos

2. **Formulário de Edição**
   - Todos os campos são pré-preenchidos com dados atuais do banco
   - Admin pode editar CPF, CNPJ, Empresa, Endereço, etc.
   - Ao salvar, todos os campos são persistidos corretamente

3. **Pessoa Física → Pessoa Jurídica**
   - Cliente que começou como PF pode ter CNPJ e Razão Social adicionados via edição
   - Dados são salvos e exibidos corretamente

---

### Testes Recomendados
1. Abrir cliente no Kanban → aba Contatos → verificar CPF, CNPJ, Razão Social
2. Clicar em "Editar" → verificar campos pré-preenchidos
3. Editar CNPJ e Razão Social de cliente PF → Salvar → Verificar exibição
4. Verificar que nenhum outro cliente foi afetado
