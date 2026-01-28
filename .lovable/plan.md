

## Correção: Adicionar Nome da Marca e Ramo de Atividade na Aba Contatos e Formulário de Edição

### Problema Identificado
Na aba **Contatos** do painel de detalhes do cliente e no formulário de edição faltam:
1. **Nome da Marca** (`brand_name`) - visível e editável
2. **Ramo de Atividade** (`business_area`) - visível e editável

Esses campos vêm da tabela `brand_processes`, não de `profiles`.

### Causa Raiz

| Local | Problema |
|-------|----------|
| `ClientKanbanBoard.tsx` (linha 19-36) | Interface `ClientWithProcess` não inclui `business_area` |
| `Clientes.tsx` (linhas 96-113) | `business_area` não é copiado do processo para o objeto cliente |
| `ClientDetailSheet.tsx` (aba Contatos) | Não exibe Nome da Marca nem Ramo de Atividade |
| `ClientDetailSheet.tsx` (formulário edição) | Não tem campos para editar `brand_name` e `business_area` |
| `handleSaveFullEdit()` | Não atualiza `brand_processes` |

---

### Solução Proposta (Isolada e Segura)

#### 1. Adicionar `business_area` à Interface `ClientWithProcess`
**Arquivo:** `src/components/admin/clients/ClientKanbanBoard.tsx` (linhas 19-36)

```typescript
export interface ClientWithProcess {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  priority: string | null;
  origin: string | null;
  contract_value: number | null;
  process_id: string | null;
  brand_name: string | null;
  business_area: string | null;  // NOVO CAMPO
  pipeline_stage: string | null;
  process_status: string | null;
  created_at?: string;
  last_contact?: string;
  cpf_cnpj?: string;
  process_number?: string;
}
```

#### 2. Copiar `business_area` ao criar objeto cliente
**Arquivo:** `src/pages/admin/Clientes.tsx` (linhas 96-113)

```typescript
// Cliente SEM processo
clientsWithProcesses.push({
  // ... campos existentes
  brand_name: null,
  business_area: null,  // ADICIONAR
  pipeline_stage: 'protocolado',
  // ...
});

// Cliente COM processo
for (const process of userProcesses) {
  clientsWithProcesses.push({
    // ... campos existentes
    brand_name: process.brand_name,
    business_area: process.business_area || null,  // ADICIONAR
    pipeline_stage: process.pipeline_stage || 'protocolado',
    // ...
  });
}
```

#### 3. Adicionar seção "Dados da Marca" na aba Contatos
**Arquivo:** `src/components/admin/clients/ClientDetailSheet.tsx`

Entre "Dados Pessoais" e "Dados da Empresa", inserir:

```tsx
{/* Dados da Marca */}
{client.brand_name && (
  <Card className="border-0 shadow-md">
    <CardContent className="pt-4">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-4 w-4 text-orange-500" />
        Dados da Marca
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">NOME DA MARCA</p>
          <p className="font-medium">{client.brand_name}</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">RAMO DE ATIVIDADE</p>
          <p className="font-medium">{client.business_area || 'N/A'}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

#### 4. Adicionar campos de marca ao formulário de edição
**Arquivo:** `src/components/admin/clients/ClientDetailSheet.tsx`

4.1. Expandir `editFormData` state (linha 187-201):
```typescript
const [editFormData, setEditFormData] = useState({
  full_name: '',
  email: '',
  phone: '',
  cpf: '',
  cnpj: '',
  company_name: '',
  address: '',
  neighborhood: '',
  city: '',
  state: '',
  zip_code: '',
  priority: 'medium',
  origin: 'site',
  brand_name: '',       // NOVO
  business_area: ''     // NOVO
});
```

4.2. Inicializar com dados do cliente (linha 241-255):
```typescript
setEditFormData({
  // ... campos existentes
  brand_name: client.brand_name || '',
  business_area: client.business_area || ''
});
```

4.3. Adicionar inputs no dialog de edição (antes de Prioridade):
```tsx
{/* Mostrar campos de marca apenas se cliente tem processo */}
{client?.process_id && (
  <>
    <div>
      <Label>Nome da Marca</Label>
      <Input 
        value={editFormData.brand_name}
        onChange={(e) => setEditFormData({...editFormData, brand_name: e.target.value})}
        placeholder="Nome da marca registrada"
      />
    </div>
    <div>
      <Label>Ramo de Atividade</Label>
      <Input 
        value={editFormData.business_area}
        onChange={(e) => setEditFormData({...editFormData, business_area: e.target.value})}
        placeholder="Ex: Tecnologia, Alimentação..."
      />
    </div>
  </>
)}
```

#### 5. Atualizar `handleSaveFullEdit()` para salvar dados do processo
**Arquivo:** `src/components/admin/clients/ClientDetailSheet.tsx` (linha 463-494)

```typescript
const handleSaveFullEdit = async () => {
  if (!client) return;

  try {
    // Atualizar profile
    const { error: profileError } = await supabase.from('profiles').update({
      full_name: editFormData.full_name,
      email: editFormData.email,
      phone: editFormData.phone,
      cpf: editFormData.cpf || null,
      cnpj: editFormData.cnpj || null,
      cpf_cnpj: editFormData.cpf || editFormData.cnpj || null,
      company_name: editFormData.company_name,
      address: editFormData.address,
      neighborhood: editFormData.neighborhood,
      city: editFormData.city,
      state: editFormData.state,
      zip_code: editFormData.zip_code,
      priority: editFormData.priority,
      origin: editFormData.origin
    }).eq('id', client.id);

    if (profileError) throw profileError;

    // Atualizar processo (se existir)
    if (client.process_id && (editFormData.brand_name || editFormData.business_area)) {
      const { error: processError } = await supabase.from('brand_processes').update({
        brand_name: editFormData.brand_name,
        business_area: editFormData.business_area || null
      }).eq('id', client.process_id);

      if (processError) throw processError;
    }

    toast.success('Dados do cliente atualizados!');
    setShowEditDialog(false);
    onUpdate();
    fetchClientData();
  } catch (error: any) {
    console.error('Error updating client:', error);
    toast.error(`Erro ao atualizar: ${error?.message || 'Tente novamente'}`);
  }
};
```

---

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/clients/ClientKanbanBoard.tsx` | Interface `ClientWithProcess` + `business_area` |
| `src/pages/admin/Clientes.tsx` | Incluir `business_area` na criação do objeto cliente |
| `src/components/admin/clients/ClientDetailSheet.tsx` | Exibição na aba Contatos, campos no formulário de edição, lógica de salvamento |

---

### Análise de Risco

| Risco | Mitigação |
|-------|-----------|
| Quebrar TypeScript em outros arquivos | Interface é apenas ampliada (campo opcional com `null`) |
| Cliente sem processo não ter marca | Exibição condicional com `{client.brand_name && ...}` |
| Falha ao salvar processo | Try/catch separado com mensagem de erro clara |
| Regressão no Kanban | `business_area` é opcional e não afeta renderização existente |

---

### Comportamento Esperado Após Correção

1. **Aba Contatos**
   - Seção "Dados da Marca" visível com Nome da Marca e Ramo de Atividade
   - Seção só aparece se cliente tem processo vinculado

2. **Formulário de Edição**
   - Campos "Nome da Marca" e "Ramo de Atividade" aparecem se cliente tem processo
   - Pré-preenchidos com dados atuais
   - Ao salvar, atualiza tanto `profiles` quanto `brand_processes`

3. **Pessoa Física que adiciona marca**
   - Cliente pode ter processo criado via botão "Novo Processo"
   - Após criar processo, campos de marca aparecem no formulário de edição

---

### Testes Recomendados
1. Abrir cliente COM processo no Kanban → verificar seção "Dados da Marca" na aba Contatos
2. Abrir cliente SEM processo → verificar que seção "Dados da Marca" NÃO aparece
3. Editar cliente COM processo → verificar campos Nome da Marca e Ramo preenchidos
4. Alterar Ramo de Atividade → Salvar → Verificar persistência
5. Criar novo processo para cliente → verificar que campos aparecem no formulário

