

## Melhorias na Importação de Clientes

### O que será feito

**1. Novos campos de mapeamento no sistema**

Adicionar 3 novos campos ao mapeamento de importação:
- **Bairro** (neighborhood) — salva na coluna `neighborhood` da tabela profiles
- **Número** (address_number) — concatenado ao campo `address` (ex: "Rua X, 123")
- **Complemento** (address_complement) — concatenado ao campo `address` (ex: "Rua X, 123, Apto 4")

**2. Auto-detecção CPF vs CNPJ**

Quando o campo mapeado for "CPF/CNPJ", o sistema analisará a quantidade de dígitos:
- 11 dígitos = CPF, salva no campo `cpf` da tabela profiles
- 14 dígitos = CNPJ, salva no campo `cnpj` da tabela profiles
- O campo legado `cpf_cnpj` continua preenchido para retrocompatibilidade

**3. Novos aliases de auto-detecção de colunas**

- "Bairro" e "neighborhood" mapeiam automaticamente para o campo Bairro
- "Número", "numero", "nro" mapeiam para Número
- "Complemento", "compl" mapeiam para Complemento
- "CPF ou CNPJ" e variações já existentes continuam funcionando

### Alterações Técnicas

#### Ficheiro 1: `src/lib/clientParser.ts`

- Adicionar `neighborhood`, `address_number` e `address_complement` ao `ParsedClient` interface
- Adicionar 3 novos campos ao array `SYSTEM_FIELDS`
- Adicionar aliases no `FIELD_ALIASES` para auto-detecção (bairro, numero, complemento)
- No `applyFieldMapping`, manter a lógica existente (os novos campos são strings simples)

#### Ficheiro 2: `src/components/admin/clients/ClientImportExportDialog.tsx`

No `handleMappingConfirm` (ou num passo antes de enviar ao edge function), ao preparar os clientes para importação:
- Concatenar `address` + `address_number` + `address_complement` num único campo `address` (ex: "Rua X, 123, Apto 4")
- Detectar se `cpf_cnpj` tem 11 ou 14 dígitos e preencher `cpf` ou `cnpj` separadamente
- Passar `neighborhood` diretamente

#### Ficheiro 3: `supabase/functions/import-clients/index.ts`

- Adicionar `neighborhood`, `cpf` e `cnpj` ao `ClientToImport` interface
- No `processClient`, salvar `neighborhood`, `cpf` e `cnpj` no upsert/update do profile
- Manter `cpf_cnpj` para retrocompatibilidade

### Resultado

- O mapeamento agora oferece Bairro, Número e Complemento como opções
- Colunas "Bairro", "Número", "Complemento" do arquivo são auto-detectadas
- CPF e CNPJ são separados automaticamente com base na quantidade de dígitos
- O ficheiro do cliente mostra CPF e CNPJ em campos distintos
- Endereço completo é montado corretamente (rua + número + complemento)
