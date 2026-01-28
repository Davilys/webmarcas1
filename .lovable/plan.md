
# Plano: Melhorias na Aba Clientes (Admin)

## Problemas Identificados

Analisei os componentes `ClientDetailSheet.tsx`, `ClientKanbanBoard.tsx` e `Clientes.tsx`. Identifiquei 6 problemas principais:

| Problema | Arquivo | Linha | Status |
|----------|---------|-------|--------|
| Nome da marca pequeno no card | `ClientKanbanBoard.tsx` | 454-456 | `text-xs text-muted-foreground` |
| Número do processo não exibido | `ClientKanbanBoard.tsx` | N/A | Campo `process_number` não é buscado |
| Botão "Gerenciar" Tags sem função | `ClientDetailSheet.tsx` | 701-703 | Botão sem onClick |
| Aba Contatos incompleta | `ClientDetailSheet.tsx` | 747-813 | Faltam CPF, endereço, dados empresa |
| Botão "Editar" não abre modal | `ClientDetailSheet.tsx` | 550-566 | Apenas alterna editMode |
| Sem opção de adicionar marca/processo | `ClientDetailSheet.tsx` | 906-911 | Apenas mensagem informativa |

---

## Implementação

### 1. Exibir Nome da Marca em Destaque + Número do Processo

**Arquivo:** `ClientKanbanBoard.tsx` (linhas 450-457)

**Antes:**
```tsx
<p className="font-bold text-sm mb-0.5 line-clamp-1">
  {client.full_name || 'Sem nome'}
</p>
<p className="text-xs text-muted-foreground line-clamp-1">
  {client.brand_name || client.company_name || 'Empresa não informada'}
</p>
```

**Depois:**
```tsx
<p className="font-bold text-sm mb-0.5 line-clamp-1">
  {client.full_name || 'Sem nome'}
</p>
{client.brand_name && (
  <div className="flex items-center gap-1.5">
    <p className="font-bold text-sm text-primary line-clamp-1">
      {client.brand_name}
    </p>
    {client.process_number && (
      <Badge variant="outline" className="text-xs font-mono px-1.5">
        #{client.process_number}
      </Badge>
    )}
  </div>
)}
{!client.brand_name && client.company_name && (
  <p className="text-xs text-muted-foreground line-clamp-1">
    {client.company_name}
  </p>
)}
```

**Atualizar interface `ClientWithProcess`:**
```tsx
export interface ClientWithProcess {
  // ... campos existentes
  process_number?: string;  // ADICIONAR
}
```

**Atualizar fetch em `Clientes.tsx`:**
```tsx
// Na query de brand_processes, incluir process_number
clientsWithProcesses.push({
  ...
  process_number: process.process_number || undefined, // ADICIONAR
});
```

---

### 2. Funcionalidade do Botão "Gerenciar" Tags

**Arquivo:** `ClientDetailSheet.tsx`

Criar sistema de tags com dialog:

```tsx
// Novos estados
const [showTagsDialog, setShowTagsDialog] = useState(false);
const [clientTags, setClientTags] = useState<string[]>([]);
const [availableTags] = useState(['VIP', 'Urgente', 'Novo', 'Renovação', 'Em Risco', 'Inativo']);

// Handler
const handleToggleTag = async (tag: string) => {
  const newTags = clientTags.includes(tag) 
    ? clientTags.filter(t => t !== tag)
    : [...clientTags, tag];
  setClientTags(newTags);
  // Salvar no banco (campo tags na profiles ou nova tabela)
};

// UI do botão Gerenciar
<Dialog open={showTagsDialog} onOpenChange={setShowTagsDialog}>
  <DialogTrigger asChild>
    <Button variant="outline" size="sm" className="h-7 text-xs">
      <Plus className="h-3 w-3 mr-1" />
      Gerenciar
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Gerenciar Tags</DialogTitle>
    </DialogHeader>
    <div className="grid grid-cols-3 gap-2 py-4">
      {availableTags.map(tag => (
        <Button
          key={tag}
          variant={clientTags.includes(tag) ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleToggleTag(tag)}
        >
          {tag}
        </Button>
      ))}
    </div>
  </DialogContent>
</Dialog>

// Exibir tags atribuídas
{clientTags.length > 0 ? (
  <div className="flex flex-wrap gap-1.5 mt-2">
    {clientTags.map(tag => (
      <Badge key={tag} variant="secondary">{tag}</Badge>
    ))}
  </div>
) : (
  <p className="text-sm text-muted-foreground">
    Nenhuma tag atribuída. Clique em "Gerenciar" para adicionar.
  </p>
)}
```

---

### 3. Aba Contatos Completa (Dados do Cliente e Empresa)

**Arquivo:** `ClientDetailSheet.tsx` (aba contacts)

Expandir a aba para exibir todos os dados disponíveis:

```tsx
<TabsContent value="contacts" className="space-y-4 mt-0">
  {/* DADOS PESSOAIS */}
  <Card className="border-0 shadow-md">
    <CardContent className="pt-4">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <User className="h-4 w-4 text-blue-500" />
        Dados Pessoais
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">NOME COMPLETO</p>
          <p className="font-medium">{client.full_name || 'N/A'}</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
          <p className="font-medium">{client.cpf_cnpj || 'N/A'}</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">E-MAIL</p>
          <p className="font-medium">{client.email || 'N/A'}</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">TELEFONE</p>
          <p className="font-medium">{client.phone || 'N/A'}</p>
        </div>
      </div>
      
      {/* ENDEREÇO */}
      {(profileData?.address || profileData?.city) && (
        <div className="mt-4 p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">ENDEREÇO COMPLETO</p>
          <p className="font-medium">
            {profileData.address}
            {profileData.address_number && `, ${profileData.address_number}`}
            {profileData.neighborhood && ` - ${profileData.neighborhood}`}
          </p>
          <p className="text-sm text-muted-foreground">
            {profileData.city}{profileData.state && ` - ${profileData.state}`}
            {profileData.zip_code && ` - CEP: ${profileData.zip_code}`}
          </p>
        </div>
      )}
    </CardContent>
  </Card>

  {/* DADOS DA EMPRESA */}
  <Card className="border-0 shadow-md">
    <CardContent className="pt-4">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-purple-500" />
        Dados da Empresa
      </h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">RAZÃO SOCIAL</p>
          <p className="font-medium">{client.company_name || 'N/A'}</p>
        </div>
        <div className="p-3 border rounded-lg">
          <p className="text-xs text-muted-foreground">CNPJ</p>
          <p className="font-medium">
            {client.cpf_cnpj?.length === 14 ? client.cpf_cnpj : 'N/A'}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>
```

Nota: Precisaremos buscar dados completos do perfil (`address`, `city`, `state`, `zip_code`, `neighborhood`) na função `fetchClientData`.

---

### 4. Botão "Editar" Abre Modal Completo

**Arquivo:** `ClientDetailSheet.tsx`

Criar dialog para edição completa:

```tsx
// Novo estado
const [showEditDialog, setShowEditDialog] = useState(false);
const [editFormData, setEditFormData] = useState({
  full_name: '',
  email: '',
  phone: '',
  cpf_cnpj: '',
  company_name: '',
  address: '',
  address_number: '',
  neighborhood: '',
  city: '',
  state: '',
  zip_code: '',
  priority: 'medium',
  origin: 'site'
});

// Abrir modal ao clicar em Editar
<Button onClick={() => setShowEditDialog(true)}>
  <Edit className="h-4 w-4 mr-2" />
  Editar
</Button>

// Dialog de edição
<Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Editar Cliente</DialogTitle>
    </DialogHeader>
    <div className="grid grid-cols-2 gap-4 py-4">
      <div className="col-span-2">
        <Label>Nome Completo</Label>
        <Input value={editFormData.full_name} onChange={...} />
      </div>
      <div>
        <Label>E-mail</Label>
        <Input value={editFormData.email} onChange={...} />
      </div>
      <div>
        <Label>Telefone</Label>
        <Input value={editFormData.phone} onChange={...} />
      </div>
      <div>
        <Label>CPF/CNPJ</Label>
        <Input value={editFormData.cpf_cnpj} onChange={...} />
      </div>
      <div>
        <Label>Empresa</Label>
        <Input value={editFormData.company_name} onChange={...} />
      </div>
      {/* ... demais campos de endereço */}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancelar</Button>
      <Button onClick={handleSaveFullEdit}>Salvar Alterações</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 5. Adicionar Marca/Processo pelo Admin

**Arquivo:** `ClientDetailSheet.tsx` (aba Services)

Quando não há processo, mostrar botão para adicionar:

```tsx
{!client.brand_name ? (
  <div className="text-center py-8">
    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
    <p className="text-muted-foreground mb-4">Nenhum processo registrado</p>
    
    <Dialog open={showAddProcessDialog} onOpenChange={setShowAddProcessDialog}>
      <DialogTrigger asChild>
        <Button className="bg-primary">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Marca/Processo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Processo de Marca</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Nome da Marca *</Label>
            <Input 
              placeholder="Ex: WebMarcas"
              value={newProcess.brand_name}
              onChange={(e) => setNewProcess({...newProcess, brand_name: e.target.value})}
            />
          </div>
          <div>
            <Label>Número do Processo (INPI)</Label>
            <Input 
              placeholder="Ex: 928374651"
              value={newProcess.process_number}
              onChange={(e) => setNewProcess({...newProcess, process_number: e.target.value})}
            />
          </div>
          <div>
            <Label>Fase do Pipeline</Label>
            <Select value={newProcess.pipeline_stage} onValueChange={...}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Área de Atuação</Label>
            <Input 
              placeholder="Ex: Tecnologia, Alimentação..."
              value={newProcess.business_area}
              onChange={(e) => setNewProcess({...newProcess, business_area: e.target.value})}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddProcessDialog(false)}>Cancelar</Button>
          <Button onClick={handleCreateProcess}>Criar Processo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
) : (
  // ... exibição do processo existente
)}
```

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/components/admin/clients/ClientKanbanBoard.tsx` | Interface + exibição nome marca em negrito + número processo |
| `src/pages/admin/Clientes.tsx` | Buscar `process_number` do banco |
| `src/components/admin/clients/ClientDetailSheet.tsx` | Tags, Contatos completos, Modal edição, Adicionar processo |

---

## Resumo Visual das Mudanças

```text
CARD DO KANBAN (Antes)
┌─────────────────────────┐
│ DAVILYS DANQUES DE...   │  ← Nome cliente (bold)
│ webmarcas               │  ← Nome marca (pequeno, cinza)
└─────────────────────────┘

CARD DO KANBAN (Depois)
┌─────────────────────────┐
│ DAVILYS DANQUES DE...   │  ← Nome cliente (bold)
│ WebMarcas  #928374651   │  ← Nome marca (bold, azul) + Processo
└─────────────────────────┘

ABA CONTATOS (Depois)
┌─────────────────────────────────────────┐
│ 👤 DADOS PESSOAIS                       │
│ Nome: João Silva    CPF: 123.456.789-00 │
│ Email: j@email.com  Telefone: (11) 9... │
│ Endereço: Rua X, 123 - Bairro Y         │
├─────────────────────────────────────────┤
│ 🏢 DADOS DA EMPRESA                     │
│ Razão Social: Empresa ABC LTDA          │
│ CNPJ: 12.345.678/0001-90                │
└─────────────────────────────────────────┘
```

---

## Estimativa

- **Complexidade**: Média-Alta
- **Arquivos alterados**: 3
- **Funcionalidades novas**: 4 (Tags, Edição completa, Contatos, Add processo)
