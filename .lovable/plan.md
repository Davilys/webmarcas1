
## Correcao: Cards Duplicados no Kanban - Agrupar por CPF/Cliente

### Problema
Quando um cliente tem mais de uma marca (multiplos `brand_processes`), o sistema cria um card separado para cada processo, resultando em cards duplicados com o mesmo nome de cliente no Kanban.

### Causa Raiz
No arquivo `src/pages/admin/Clientes.tsx` (linhas 270-294), o loop `for (const process of userProcesses)` cria uma entrada `ClientWithProcess` por processo. O Kanban renderiza um card por entrada.

### Solucao
Agrupar por `profile.id` (cliente unico). Cada cliente aparece como 1 card, com todas as suas marcas listadas. O card usa o processo mais recente para determinar a posicao no Kanban.

### Alteracoes

#### 1. `src/components/admin/clients/ClientKanbanBoard.tsx` - Interface e renderizacao

Adicionar campo `brands` a interface `ClientWithProcess`:

```text
brands?: { id: string; brand_name: string; pipeline_stage: string; process_number?: string }[];
```

No card (linhas 481-497), quando `brands` tem mais de 1 item:
- Mostrar nome da primeira marca + badge "N marcas"
- Tooltip listando todas as marcas

#### 2. `src/pages/admin/Clientes.tsx` - Agrupar processos por cliente

Substituir o loop que cria 1 entrada por processo por logica de agrupamento:
- Para cada profile, agrupar todos os processos no campo `brands`
- Usar o processo com `updated_at` mais recente como referencia para `process_id` e `pipeline_stage`
- Criar 1 unica entrada `ClientWithProcess` por profile

**Logica de agrupamento:**

```text
// Em vez de criar 1 entrada por processo:
for (const process of userProcesses) { ... }

// Criar 1 entrada por cliente com todas as marcas:
const mainProcess = userProcesses[0]; // mais recente (ja ordenado)
const brands = userProcesses.map(p => ({
  id: p.id,
  brand_name: p.brand_name,
  pipeline_stage: p.pipeline_stage || 'protocolado',
  process_number: p.process_number || undefined,
}));

clientsWithProcesses.push({
  ...profileData,
  process_id: mainProcess.id,
  brand_name: mainProcess.brand_name,
  pipeline_stage: mainProcess.pipeline_stage,
  brands: brands,
});
```

#### 3. Drag-and-drop

Quando o card e arrastado, atualiza o `process_id` principal (processo mais recente). Isso ja funciona com a logica atual - nenhuma alteracao necessaria no handler de drop.

#### 4. Busca

A busca existente ja filtra por `full_name`, `email`, `phone`, etc. Adicionar busca tambem no array `brands` para encontrar por nome de marca.

### Seguranca

- Nenhuma tabela alterada
- Nenhum schema modificado
- Nenhuma Edge Function alterada
- Apenas logica de agrupamento no frontend (2 arquivos)
- Drag-and-drop continua funcionando
- Cards existentes duplicados serao automaticamente agrupados
- Ficha de detalhes (ClientDetailSheet) nao e afetada pois ja busca processos pelo `profile.id`

### Arquivos a Editar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/admin/clients/ClientKanbanBoard.tsx` | Adicionar `brands` a interface, atualizar card para mostrar marcas agrupadas |
| `src/pages/admin/Clientes.tsx` | Alterar `fetchClients` para agrupar processos por profile (1 entrada por cliente) |
