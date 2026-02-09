
# Organizar Documentos por Tipo e por Cliente

## O que sera feito

Adicionar duas camadas de organizacao na pagina de Documentos do admin:

### 1. Abas por Tipo de Documento
Adicionar abas (Tabs) acima da tabela, similar ao que foi feito na pagina de Contratos:
- **Todos** (aba padrao)
- **Contrato** (inclui tipos `contrato` e `contract`)
- **Procuracao**
- **Anexo**
- **Certificado**
- **Comprovante**
- **Parecer INPI**
- **Outros** (agrupa laudo, notificacao, rpi, outro)

### 2. Filtro por Cliente
Adicionar um seletor (Select) de cliente ao lado do filtro de tipo existente. Ao selecionar um cliente, a lista mostrara apenas os documentos daquele cliente.

### 3. Correcao do tipo "contract"
No banco existem 18 documentos com tipo `contract` (em ingles) que nao mapeiam para nenhum item da lista `documentTypes`. Sera adicionado o mapeamento para que esses documentos exibam corretamente como "Contrato".

## Detalhes Tecnicos

### Arquivo: `src/pages/admin/Documentos.tsx`

1. **Importar** `Tabs, TabsList, TabsTrigger, TabsContent` de `@/components/ui/tabs`

2. **Corrigir mapeamento de tipos**: Adicionar `contract` como alias para `contrato` na lista `documentTypes`, ou tratar no filtro para que ambos sejam agrupados

3. **Adicionar estado**:
   - `activeTab` (string) - aba de tipo ativa
   - `clientFilter` (string) - filtro de cliente selecionado

4. **Adicionar Select de cliente** na barra de filtros, usando a lista `clients` ja carregada

5. **Adicionar componente Tabs** entre os filtros e o Card da tabela, com as abas por tipo

6. **Atualizar logica de filtragem** para considerar:
   - Aba ativa (tipo de documento)
   - Filtro de cliente selecionado
   - Busca por texto (ja existente)

7. Os filtros existentes (busca e dropdown de tipo) continuam funcionando em conjunto com as abas e o filtro de cliente
