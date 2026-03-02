

## Correcao Critica: Fluxo Revista INPI - Publicacoes - Ficheiro do Cliente

### Resumo

Tres ajustes cirurgicos no arquivo `PublicacaoTab.tsx` para corrigir o fluxo completo:

1. **Filtrar publicacoes sem cliente** - Apenas publicacoes com `client_id` preenchido aparecem na aba Publicacoes
2. **Garantir UPDATE (nunca INSERT)** - O fluxo da Revista ja faz UPDATE no registro existente (implementado anteriormente), nenhuma alteracao necessaria nesta parte
3. **Abrir ficheiro do cliente ao clicar no card** - Ao clicar em um card no Kanban ou na lista, abrir o `ClientDetailSheet` do cliente vinculado (o mesmo ficheiro usado na aba Clientes), sem criar tela nova ou duplicar dados

### Detalhes Tecnicos

**Arquivo unico a alterar:** `src/components/admin/PublicacaoTab.tsx`

**Alteracao 1 - Filtro de visibilidade (linha ~853)**

No `useMemo` do `filtered`, adicionar como primeira condicao do filtro:

```typescript
// Somente publicacoes com cliente vinculado aparecem
if (!pub.client_id) return false;
```

Isso garante que publicacoes sem cliente vinculado nao aparecem no Kanban nem na lista. Zero alteracao no banco, apenas filtro no frontend.

**Alteracao 2 - Clique no card abre ficheiro do cliente**

O comportamento atual ja abre o `ClientDetailSheet` ao clicar (linhas 1647-1651 para Kanban, linhas 1695-1699 para lista). Como agora so aparecem publicacoes com cliente vinculado (Alteracao 1), o `selectedClientForSheet` sempre tera um cliente real, nunca o placeholder "Sem cliente vinculado".

O codigo existente na linha 946-978 ja constroi o `ClientWithProcess` corretamente quando `sheetPub.client_id` existe - busca o cliente no `clientMap`, carrega todos os processos do cliente, e passa para o `ClientDetailSheet`. Isso e exatamente o mesmo ficheiro que aparece na aba Clientes.

Nenhuma alteracao necessaria no comportamento de clique - o filtro da Alteracao 1 resolve o problema automaticamente.

**Alteracao 3 - Remover o painel lateral de detalhes da publicacao**

O bloco do painel lateral (linhas ~1771-2040, ativado por `selected && !showClientSheet`) mostra detalhes internos da publicacao (timeline, prazo, documento). Este painel usa `selectedId`, que e diferente de `sheetPubId`. Atualmente, ao clicar no card, o sistema define `sheetPubId` e abre o `ClientDetailSheet`, mas tambem pode definir `selectedId` mostrando o painel lateral em paralelo.

Para manter o fluxo limpo: ao clicar no card, apenas abrir o ficheiro do cliente. O painel lateral de detalhes da publicacao permanece acessivel apenas quando necessario (ex: via selecao na barra de ferramentas), sem conflito com o ficheiro.

### O que NAO sera alterado

- Nenhuma tabela do banco de dados
- Nenhuma query de insercao/criacao
- Nenhum outro arquivo alem de `PublicacaoTab.tsx`
- Nenhum fluxo existente da Revista INPI, Clientes ou Area do Cliente
- Nenhuma estrutura de dados

### Resultado Final

```text
Revista → Processos → Vincular Cliente + Definir Tipo →
Salvar (UPDATE no registro existente) →
Publicacao aparece na aba Publicacoes (porque agora tem client_id) →
Clique no card → Abre o MESMO ficheiro do cliente (ClientDetailSheet)
```

