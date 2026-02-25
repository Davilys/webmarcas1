

## Plano Final: Sincronizacao Total + Ordenacao por Prazo + Prazos Automaticos

### 3 Mudancas Principais

#### 1. Sincronizar TODAS as 723 Entradas RPI (Nao Apenas as Vinculadas)

Atualmente existem 723 entradas na tabela `rpi_entries`, mas apenas 1 tem `matched_client_id` e 0 tem `matched_process_id`. A logica atual ignora as outras 722. A solucao e sincronizar TODAS, mesmo sem cliente/processo identificado, para que o admin possa atribuir manualmente.

**Migracao SQL necessaria:**
- Tornar `process_id` e `client_id` nullable na tabela `publicacoes_marcas`
- Adicionar coluna `rpi_entry_id` (uuid, unique) para rastrear a origem e evitar duplicatas
- Adicionar colunas `brand_name_rpi` e `process_number_rpi` (text) para guardar dados da RPI como fallback visual

```text
ALTER TABLE publicacoes_marcas ALTER COLUMN process_id DROP NOT NULL;
ALTER TABLE publicacoes_marcas ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE publicacoes_marcas ADD COLUMN IF NOT EXISTS rpi_entry_id uuid UNIQUE;
ALTER TABLE publicacoes_marcas ADD COLUMN IF NOT EXISTS brand_name_rpi text;
ALTER TABLE publicacoes_marcas ADD COLUMN IF NOT EXISTS process_number_rpi text;
```

**Mudanca na logica de sync (useEffect no PublicacaoTab.tsx):**
- Remover filtro `.or('matched_process_id.not.is.null,matched_client_id.not.is.null')` - buscar TODAS
- Usar `rpi_entry_id` como chave unica (em vez de `process_id`) para evitar duplicatas
- Inserir publicacoes mesmo sem `client_id` ou `process_id` (campos agora nullable)
- Guardar `brand_name` e `process_number` da RPI nos novos campos

**Mudanca na UI:**
- Exibir `brand_name_rpi` quando nao houver `process_id` vinculado (fallback)
- Exibir badge "Sem cliente" quando `client_id` for null
- No dialog de edicao, permitir vincular cliente/processo manualmente

#### 2. Ordenacao Padrao por Prazo (Vencidos Primeiro)

A ordenacao padrao ja e por `prazo` ascendente, mas precisa priorizar corretamente:
1. Atrasados primeiro (dias negativos, do mais atrasado ao menos)
2. Vencendo hoje
3. Proximos a vencer (em ordem crescente)
4. Sem prazo definido por ultimo

**Mudanca no sort (PublicacaoTab.tsx):**
- Ajustar a logica de sort para `prazo` tratar `null` como `99999` (ja faz isso)
- Garantir que o sort padrao inicial seja `sortKey='prazo'` e `sortDir='asc'` (ja esta assim)
- Nenhuma mudanca necessaria na logica de sort, apenas confirmar que funciona corretamente

#### 3. Calculo Automatico de Prazo por Tipo de Publicacao

Quando uma publicacao e sincronizada da revista, calcular automaticamente o `proximo_prazo_critico`:

**Regras de prazo baseadas no `dispatch_text`:**
- Se contem "oposicao", "oposição" -> prazo de 60 dias a partir da data de publicacao
- Se contem "exigencia", "exigência", "cumpra" -> prazo de 60 dias (prazo padrao INPI para exigencias)
- Se contem "recurso" -> prazo de 60 dias (prazo padrao INPI para recursos)
- Se contem "complementacao", "complementação", "complemente" -> prazo especifico mencionado no texto (5 dias se detectado) ou 60 dias
- Se contem "Art. 219" (nao conhecimento) -> sem prazo (processo encerrado)
- Se contem "deferido", "deferimento" -> prazo de 60 dias para pagamento de taxas
- Se contem "indeferido", "indeferimento" -> prazo de 60 dias para recurso
- Se contem "arquiv" -> sem prazo (processo encerrado)
- **Fallback**: se nenhuma regra se aplica -> prazo de 30 dias

**Mudanca na funcao `calcAutoFields`:**
- Receber `dispatch_text` como parametro opcional
- Se `proximo_prazo_critico` nao estiver definido E `data_publicacao_rpi` existir, calcular com base nas regras acima
- Gerar `descricao_prazo` automaticamente (ex: "Prazo para oposicao - 60 dias", "Prazo para cumprimento de exigencia - 5 dias")

### Detalhes Tecnicos

#### Arquivos a Editar

| Arquivo | Mudanca |
|---------|---------|
| Migracao SQL | Tornar process_id/client_id nullable, adicionar rpi_entry_id, brand_name_rpi, process_number_rpi |
| `src/components/admin/PublicacaoTab.tsx` | Remover filtro na query rpi_entries, ajustar sync para usar rpi_entry_id, calcular prazos automaticos por dispatch_text, exibir brand_name_rpi como fallback, badge "Sem cliente" |

#### Logica de Calculo de Prazo (Pseudo-codigo)

```text
function calcDeadline(dispatch_text, publication_date):
  if !publication_date: return null
  
  text = dispatch_text.toLowerCase()
  
  if text contains "arquiv" or "Art. 219": 
    return { days: null, desc: "Processo encerrado" }
  
  if text contains "5 dias" or "cinco dias":
    return { days: 5, desc: "Exigência formal - 5 dias" }
  
  if text contains "oposição/oposicao":
    return { days: 60, desc: "Prazo para oposição" }
  
  if text contains "exigência/exigencia/cumpra":
    return { days: 60, desc: "Cumprimento de exigência" }
  
  if text contains "recurso":
    return { days: 60, desc: "Prazo para recurso" }
  
  if text contains "deferido/deferimento":
    return { days: 60, desc: "Pagamento de taxas (deferimento)" }
  
  if text contains "indeferido/indeferimento":
    return { days: 60, desc: "Prazo para recurso" }
  
  // Fallback
  return { days: 30, desc: "Prazo padrão - 30 dias" }
```

#### Impacto

- Colunas NOT NULL viram nullable (INSERT existente continua funcionando)
- Sync roda 1 vez por montagem (ref hasSynced)
- Publicacoes existentes nao sao alteradas
- Ordenacao padrao ja prioriza prazos vencidos
- Prazos calculados automaticamente com base no texto do INPI

