
# Plano: Corrigir Sincronização do Pipeline Stage na Aba Serviços

## Problema Identificado

Ao visualizar um cliente na aba "Serviços", quando o admin seleciona uma fase diferente no dropdown (ex: "Indeferimento"), a alteração é salva no banco de dados, mas a visualização não atualiza imediatamente e o card no Kanban pode não refletir a mudança corretamente.

Além disso, o dropdown só aparece quando o modo de edição está ativado, o que confunde o usuário.

### Diagnóstico Técnico

| Problema | Localização | Causa |
|----------|-------------|-------|
| Dropdown só aparece em modo edição | Linha 1031 | `{editMode && (...)}` |
| `currentStage` não atualiza após mudança | Linha 596 | Usa `client.pipeline_stage` direto sem considerar `editData.pipeline_stage` |
| "Tipo de Serviço" não é interativo | Linhas 1096-1110 | Cards sem `onClick`, sempre "pedido_registro" selecionado |
| Sem mapeamento Tipo de Serviço → Pipeline Stage | N/A | Lógica não implementada |

---

## Solução Proposta

### 1. Tornar o Dropdown Sempre Visível (Não Apenas em EditMode)

**Arquivo:** `ClientDetailSheet.tsx` (linhas 1031-1050)

```tsx
// ANTES: Dropdown só aparece em editMode
{editMode && (
  <Select ...>
)}

// DEPOIS: Dropdown sempre visível, funcional imediatamente
<Select 
  value={editData.pipeline_stage} 
  onValueChange={async (v) => {
    setEditData({ ...editData, pipeline_stage: v });
    if (client?.process_id) {
      await supabase.from('brand_processes')
        .update({ pipeline_stage: v })
        .eq('id', client.process_id);
      toast.success(`Fase atualizada para ${PIPELINE_STAGES.find(s => s.id === v)?.label}`);
      onUpdate();
    }
  }}
>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="Fase do processo" />
  </SelectTrigger>
  <SelectContent>
    {PIPELINE_STAGES.map(s => (
      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 2. Usar `editData.pipeline_stage` para Exibir Fase Atual

**Arquivo:** `ClientDetailSheet.tsx` (linha 596)

```tsx
// ANTES: Usa client.pipeline_stage (não atualiza em tempo real)
const currentStage = PIPELINE_STAGES.find(s => s.id === (client.pipeline_stage || 'protocolado'));

// DEPOIS: Usa editData.pipeline_stage (atualiza imediatamente)
const currentStage = PIPELINE_STAGES.find(s => s.id === (editData.pipeline_stage || client.pipeline_stage || 'protocolado'));
```

Isso garante que ao selecionar uma nova fase no dropdown, a visualização ("Fase Atual: PROTOCOLADO") atualize imediatamente para a nova fase selecionada.

### 3. Tornar "Tipo de Serviço" Interativo e Conectado ao Pipeline

Adicionar estado para o tipo de serviço selecionado e lógica para mapear tipos de serviço para fases do pipeline:

```tsx
// Novo estado
const [selectedServiceType, setSelectedServiceType] = useState<string>('pedido_registro');

// Mapeamento Tipo de Serviço → Pipeline Stage sugerido
const SERVICE_TYPE_TO_STAGE: Record<string, string> = {
  'pedido_registro': 'protocolado',
  'cumprimento_exigencia': '003',
  'oposicao': 'oposicao',
  'recurso': 'indeferimento',
  'renovacao': 'renovacao',
  'notificacao': 'notificacao'
};

// Handler para seleção de tipo de serviço
const handleServiceTypeSelect = async (serviceId: string) => {
  setSelectedServiceType(serviceId);
  
  // Atualizar pipeline stage baseado no tipo de serviço
  const suggestedStage = SERVICE_TYPE_TO_STAGE[serviceId];
  if (suggestedStage && client?.process_id) {
    setEditData(prev => ({ ...prev, pipeline_stage: suggestedStage }));
    await supabase.from('brand_processes')
      .update({ pipeline_stage: suggestedStage })
      .eq('id', client.process_id);
    toast.success(`Fase atualizada para ${PIPELINE_STAGES.find(s => s.id === suggestedStage)?.label}`);
    onUpdate();
  }
};
```

**Atualizar UI dos Cards de Tipo de Serviço:**

```tsx
{SERVICE_TYPES.map(service => (
  <motion.div
    key={service.id}
    whileHover={{ scale: 1.02 }}
    onClick={() => handleServiceTypeSelect(service.id)}
    className={cn(
      "p-3 rounded-lg border cursor-pointer transition-all",
      selectedServiceType === service.id 
        ? "border-primary bg-primary/5 ring-2 ring-primary/30" 
        : "border-border hover:border-primary/50"
    )}
  >
    <p className="font-medium text-sm">{service.label}</p>
    <p className="text-xs text-muted-foreground">{service.description}</p>
  </motion.div>
))}
```

---

## Fluxo Visual Após Correção

```text
┌────────────────────────────────────────────────────────────────────┐
│  📋 Serviços Contratados              [Indeferimento ▼]           │
├────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 📄 Registro de Marca                           em_andamento  │ │
│  │    Davilys                                                   │ │
│  │  ┌──────────────────────────────────────────────────────┐   │ │
│  │  │ Fase Atual                                           │   │ │
│  │  │ INDEFERIMENTO  ← Atualiza imediatamente              │   │ │
│  │  │ Pedido indeferido. Recurso pode ser interposto.      │   │ │
│  │  └──────────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  Tipo de Serviço                                                   │
│  ┌─────────────────────┐  ┌─────────────────────────┐             │
│  │ Pedido de Registro  │  │ Cumprimento de Exigência│             │
│  └─────────────────────┘  └─────────────────────────┘             │
│  ┌─────────────────────┐  ┌─────────────────────────┐             │
│  │ Manifestação de     │  │ ██ Recurso ██████████   │ ← Selecionado│
│  │ Oposição            │  │ Administrativo         │             │
│  └─────────────────────┘  └─────────────────────────┘             │
└────────────────────────────────────────────────────────────────────┘

         ↓ Sincroniza automaticamente
         
┌─────────────────────────────────────────────────────────────────────┐
│  KANBAN: Coluna "Indeferimento"                                     │
│  ┌──────────────────────────────────┐                               │
│  │ DAVILYS DANQUES                  │                               │
│  │ Davilys  #928374651              │                               │
│  └──────────────────────────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/clients/ClientDetailSheet.tsx` | Dropdown sempre visível, `currentStage` usa `editData`, Tipo de Serviço interativo |

---

## Resumo das Mudanças

1. **Dropdown de Fase sempre visível** - Não precisa entrar em modo de edição
2. **Fase Atual atualiza imediatamente** - Usa `editData.pipeline_stage` em vez de `client.pipeline_stage`
3. **Tipo de Serviço é clicável** - Ao clicar, seleciona o tipo e atualiza a fase correspondente
4. **Mapeamento automático** - Recurso Administrativo → Indeferimento, etc.
5. **Sincronização com Kanban** - `onUpdate()` garante que o Kanban reflita a mudança

---

## Estimativa

- **Complexidade**: Baixa-Média
- **Arquivos alterados**: 1
- **Linhas modificadas**: ~30
- **Risco**: Baixo (apenas adiciona funcionalidade, não remove)
