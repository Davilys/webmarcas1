

# Ficha Editavel de Marca (inline na aba Marcas)

## Objetivo

Ao clicar em um card de marca na aba "Marcas" do ficheiro do cliente, abre uma view inline (dentro do proprio ficheiro) onde o usuario pode visualizar e editar todas as informacoes da marca, incluindo:
- Nome da marca
- Numero do processo INPI
- Protocolo INPI
- Classes NCL
- Ramo de atividade
- Status do processo
- Fase do pipeline
- Datas (deposito, concessao, validade)
- Proximo passo e data
- Notas/observacoes

## Funcionamento

```text
[Card Marca 1]  <-- clicado
[Card Marca 2]

  +----------------------------------------------+
  | DETALHES DA MARCA - WebMarcas       [X] [Salvar] |
  |                                              |
  | Nome da Marca:      [________________]       |
  | Numero do Processo:  [________________]       |
  | Protocolo INPI:      [________________]       |
  | Classes NCL:         [________________]       |
  | Ramo de Atividade:   [________________]       |
  | Status:              [select___________]      |
  | Fase do Pipeline:    [select___________]      |
  |                                              |
  | Data Deposito:       [____/____/____]        |
  | Data Concessao:      [____/____/____]        |
  | Data Validade:       [____/____/____]        |
  | Proximo Passo:       [________________]       |
  | Data Proximo Passo:  [____/____/____]        |
  |                                              |
  | Notas:                                       |
  | [__________________________________]         |
  |                                              |
  | [====== SALVAR ALTERACOES ======]            |
  +----------------------------------------------+
```

## Arquivo a modificar

### `src/components/admin/clients/ClientDetailSheet.tsx`

**Adicionar estado:**
- `expandedBrandId: string | null` - controla qual marca esta expandida para edicao
- `editingBrandData: object` - dados temporarios do formulario de edicao

**Modificar a aba Marcas (linhas ~2111-2181):**
- Tornar cada card de marca clicavel (cursor-pointer, hover effect)
- Ao clicar, expandir abaixo do card um formulario inline com todos os campos da tabela `brand_processes`
- Formulario com inputs para: brand_name, process_number, inpi_protocol, ncl_classes (input de texto com virgulas), business_area, status (select), pipeline_stage (select com etapas dinamicas), deposit_date, grant_date, expiry_date, next_step, next_step_date, notes
- Botao "Salvar" que faz update na tabela `brand_processes` e recarrega os dados
- Botao "X" para fechar sem salvar
- Animacao com framer-motion (AnimatePresence) para abrir/fechar suavemente

**Campos editaveis:**

| Campo | Tipo | Descricao |
|-------|------|-----------|
| brand_name | Input texto | Nome da marca |
| process_number | Input texto | Numero do processo INPI |
| inpi_protocol | Input texto | Protocolo INPI |
| ncl_classes | Input texto | Classes NCL (separadas por virgula) |
| business_area | Input texto | Ramo de atividade |
| status | Select | em_andamento, deferido, indeferido, arquivado, certificado |
| pipeline_stage | Select | Etapas dinamicas do Kanban |
| deposit_date | Input date | Data de deposito |
| grant_date | Input date | Data de concessao |
| expiry_date | Input date | Data de validade |
| next_step | Input texto | Proximo passo |
| next_step_date | Input date | Data do proximo passo |
| notes | Textarea | Observacoes gerais |

## Detalhes Tecnicos

### Persistencia
- Update direto na tabela `brand_processes` via Supabase client
- Apos salvar, chama `fetchClientData()` para recarregar e `onUpdate()` para atualizar o Kanban

### Seguranca
- Nenhuma tabela nova criada
- Nenhuma coluna nova criada
- Usa apenas colunas ja existentes na tabela `brand_processes`
- Componente isolado dentro da aba Marcas, sem afetar nenhuma outra funcionalidade

### UI
- O formulario aparece com animacao suave (framer-motion)
- Layout em grid de 2 colunas para campos curtos, 1 coluna para notas
- Estilo consistente com o restante do ficheiro (rounded-2xl, border-border, bg-card)
- Ao salvar exibe toast de sucesso

