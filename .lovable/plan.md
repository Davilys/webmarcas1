

## Prazos Automáticos nos Cards do Kanban + Auto-Arquivamento + Prazo de 9 anos para Certificado

### O que será feito

**1. Fallback de prazo em TODOS os cards**

Atualmente, se `proximo_prazo_critico` estiver vazio, o card não mostra dias restantes. Será adicionado um cálculo de fallback:
- Status `certificado`: prazo = `data_publicacao_rpi + 9 anos` (3285 dias) para renovação
- Outros status: prazo = `data_publicacao_rpi + 60 dias`

**2. Auto-arquivamento client-side**

Ao carregar os dados, publicações com prazo expirado (dias < 0) e que NÃO estão em `arquivado` nem `certificado` serão automaticamente movidas para `arquivado`, com sincronização bidirecional para `brand_processes.pipeline_stage = 'distrato'`.

**3. Prazo de 9 anos para Certificado**

Quando o status é `certificado`, o prazo crítico passa a ser calculado como 9 anos (data da publicação + 9 anos), representando o prazo de renovação. Os cards mostrarão os dias restantes até essa data.

### Alterações Técnicas

#### Ficheiro 1: `src/components/admin/publicacao/PublicacaoKanban.tsx`

Alterar o cálculo de `days` (linha 160) para incluir fallback:

```typescript
// Antes:
const days = pub.proximo_prazo_critico ? differenceInDays(...) : null;

// Depois:
let deadlineDate = pub.proximo_prazo_critico;
if (!deadlineDate && pub.data_publicacao_rpi) {
  if (pub.status === 'certificado') {
    deadlineDate = addYears(parseISO(pub.data_publicacao_rpi), 9).toISOString();
  } else {
    deadlineDate = addDays(parseISO(pub.data_publicacao_rpi), 60).toISOString();
  }
}
const days = deadlineDate ? differenceInDays(parseISO(deadlineDate), new Date()) : null;
```

Adicionar imports de `addDays` e `addYears` do date-fns.

Atualizar a interface `Publicacao` local para incluir `data_publicacao_rpi`.

#### Ficheiro 2: `src/components/admin/PublicacaoTab.tsx`

**A. Auto-archive via useEffect**

Adicionar um `useEffect` que, após o fetch das publicações, verifica publicações com prazo vencido e status diferente de `arquivado`/`certificado`. Para cada uma:
- Atualiza `publicacoes_marcas.status = 'arquivado'`
- Atualiza `brand_processes.pipeline_stage = 'distrato'` (se `process_id` existe)
- Invalida as queries para refrescar o Kanban

**B. Garantir que o calcAutoFields trata certificado com 9 anos**

A lógica já existe parcialmente (linhas 178-180 usam `data_certificado`), mas será reforçada: se o status é `certificado` e não tem `data_certificado` preenchido, usar `data_publicacao_rpi` como base para calcular `proximo_prazo_critico = data_publicacao_rpi + 9 anos`.

**C. Fallback no cálculo de dias na lista (view lista)**

Aplicar o mesmo fallback (60 dias ou 9 anos) quando `proximo_prazo_critico` é null nos cards da lista, para consistência.

### Resultado

- Todos os cards do Kanban e da lista mostram "Xd restantes" ou "Xd atrasado"
- Cards em `certificado` mostram o prazo de 9 anos para renovação
- Publicações com prazo vencido (exceto certificado) são automaticamente arquivadas
- O arquivamento sincroniza com o Kanban Jurídico (brand_processes)
- Ambas as abas (Publicações e Clientes Jurídico) refletem a mesma informação

