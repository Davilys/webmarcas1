

# Atualizar Aba de Contratos com Separacao por Tipo

## Problema Atual
1. Todos os contratos aparecem numa lista unica sem separacao por tipo.
2. A coluna "Tipo de Contrato" mostra "Nao definido" porque o campo `contract_type_id` esta NULL em todos os 56 contratos, mesmo que cada contrato tenha um `template_id` valido que aponta para um template com tipo definido.

## Solucao

### 1. Corrigir dados existentes
Criar uma migracao SQL que preencha o `contract_type_id` dos contratos existentes baseado no template associado:
- Contratos com template "Contrato Padrao - Registro de Marca INPI" (32 contratos) -> tipo "Registro de Marca"
- Contratos com template "Procuracao INPI - Padrao" (20 contratos) -> tipo "PROCURACAO"
- Contratos com template "Distrato sem Multa - Padrao" (2 contratos) -> tipo "DISTRATO SEM MULTA"
- Contratos com template "Distrato com Multa - Padrao" (2 contratos) -> tipo "DISTRATO COM MULTA"

### 2. Adicionar abas na pagina de Contratos
Modificar `src/pages/admin/Contratos.tsx` para incluir abas (Tabs) que separam contratos por tipo de template:
- **Todos** (aba padrao, mostra tudo como hoje)
- **Contrato Padrao - Registro de Marca INPI**
- **Procuracao INPI - Padrao**
- **Distrato sem Multa - Padrao**
- **Distrato com Multa - Padrao**

As abas ficarao entre os filtros e os cards de estatisticas. Cada aba filtrara a lista pela coluna `template_name` (via join com `contract_templates`). Os cards de estatisticas e a tabela serao atualizados conforme a aba selecionada.

### 3. Exibir tipo de contrato correto na tabela
Na coluna "Tipo de Contrato", em vez de usar `contract_type.name` (que esta NULL), usar o nome do template (`contract_templates.name`) como fallback.

## Detalhes Tecnicos

### Migracao SQL
```sql
UPDATE contracts c
SET contract_type_id = t.contract_type_id
FROM contract_templates t
WHERE c.template_id = t.id
AND c.contract_type_id IS NULL
AND t.contract_type_id IS NOT NULL;
```

### Mudancas no Arquivo `src/pages/admin/Contratos.tsx`
1. Importar componentes `Tabs, TabsList, TabsTrigger, TabsContent` de `@/components/ui/tabs`
2. Atualizar a query Supabase para incluir join com `contract_templates`:
   ```
   contract_template:contract_templates(name)
   ```
3. Adicionar estado `activeTab` para controlar a aba selecionada
4. Adicionar componente de abas acima da tabela com as 5 opcoes (Todos + 4 tipos)
5. Filtrar `filteredContracts` pela aba ativa comparando `contract.contract_template?.name`
6. Na coluna "Tipo de Contrato", exibir `contract.contract_template?.name` como fallback quando `contract_type?.name` for nulo
7. Atualizar os cards de estatisticas para refletir apenas os contratos da aba ativa

### Interface da Contract
Adicionar campo opcional:
```typescript
contract_template?: { name: string } | null;
```

