

## Plano: Corrigir cards "Sem cliente" que ainda aparecem no Kanban

### Problema raiz
O filtro atual (linha 906) remove publicações onde `client_id` e `null`. Porem, existem publicações onde `client_id` esta preenchido mas o perfil do cliente **nao existe** na tabela `profiles` (foi deletado, ou o ID e invalido). Nesses casos:
- O card passa pelo filtro (tem `client_id`)
- Mas `clientMap.get(pub.client_id)` retorna `undefined`
- O Kanban exibe "Sem cliente" porque `client?.full_name` e falsy
- Ao clicar, nada acontece porque `fetchClientForSheet` falha silenciosamente

### Solucao
Adicionar uma segunda verificacao no filtro: alem de `client_id` existir, o perfil do cliente deve existir no `clientMap`.

### Alteracoes

**Arquivo: `src/components/admin/PublicacaoTab.tsx`**

1. **Linha 906** — Filtro principal: mudar de:
   ```typescript
   if (!pub.client_id) return false;
   ```
   Para:
   ```typescript
   if (!pub.client_id || !clientMap.get(pub.client_id)) return false;
   ```

2. **Linha 897** — Status counts: aplicar mesmo filtro:
   ```typescript
   publicacoes.filter(p => !!p.client_id && !!clientMap.get(p.client_id))
   ```

3. **Linha 1306** — Orphan count: incluir tambem publicacoes com `client_id` invalido:
   ```typescript
   const orphanCount = useMemo(() => publicacoes.filter(p => !p.client_id || !clientMap.get(p.client_id)).length, [publicacoes, clientMap]);
   ```

4. **KPI stats (linhas 880-892)**: usar mesmo filtro `withClient`:
   ```typescript
   const withClient = publicacoes.filter(p => !!p.client_id && !!clientMap.get(p.client_id));
   ```

### Resultado
- Cards so aparecem se o cliente vinculado realmente existe no sistema
- Banner "X publicacoes sem cliente vinculado" inclui publicacoes com IDs orfaos
- Botao "Auto-vincular" pode tentar resolver esses IDs invalidos

