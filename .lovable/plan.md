
# Adicionar aba "Dados da Marca" no Novo Contrato (Cliente Existente)

## Objetivo
Quando o admin seleciona "Contrato Padrao - Registro de Marca INPI" no fluxo de cliente existente, adicionar uma 3a aba "Dados da Marca" entre "Informacoes Basicas" e "Dados do Signatario". Essa aba cobre dois cenarios:
- **Marca existente**: selecionar marca do cliente + escolher novas classes NCL (todas as 45 classes listadas)
- **Nova marca**: digitar nome e ramo de atividade + botao "Gerar Classes por IA" que sugere classes automaticamente

## Arquivo a modificar
`src/components/admin/contracts/CreateContractDialog.tsx`

## Alteracoes

### 1. Novos estados
- `clientBrands`: array de marcas do cliente (vindas de `brand_processes`)
- `useExistingBrand`: boolean para alternar entre marca existente e nova marca
- `existingBrandId`: id da marca selecionada

### 2. Carregar marcas ao selecionar cliente
Na funcao `handleSelectClient` (linha 261), apos selecionar o perfil, buscar todas as marcas dele em `brand_processes` (campos: `id`, `brand_name`, `business_area`, `ncl_classes`) e salvar em `clientBrands`.

### 3. Extrair NCL_CLASS_DESCRIPTIONS
Copiar o mapa das 45 classes NCL (ja existe em `src/pages/AssinarDocumento.tsx` linhas 17-63) para dentro do componente, para uso na listagem completa de classes.

### 4. Tabs: de 2 para 3 (quando template e "Registro de Marca")
Na linha 2034-2038, quando `isStandardContractTemplate` for true e nao for monitoramento:

```text
Antes:  [Informacoes Basicas] [Dados do Signatario]
Depois: [Informacoes Basicas] [Dados da Marca] [Dados do Signatario]
```

### 5. Conteudo da aba "Dados da Marca"

**Secao superior - Tipo de marca:**
- Radio/toggle: "Marca ja registrada" vs "Nova marca"

**Se "Marca ja registrada":**
- Select com as marcas do cliente (`clientBrands`), mostrando nome + classes atuais
- Ao selecionar, preencher `formData.brand_name` com o nome da marca
- Exibir as classes ja registradas dessa marca como badges (informativas, nao editaveis)
- Abaixo, lista das 45 classes NCL com checkbox, numero e descricao resumida ao lado (ScrollArea com altura fixa)
- Classes ja registradas da marca aparecem desabilitadas com indicacao visual
- O usuario seleciona as NOVAS classes que deseja registrar

**Se "Nova marca":**
- Campo "Nome da Marca" (text input) - preenche `formData.brand_name`
- Campo "Ramo de Atividade" (text input) - preenche `brandData.businessArea`
- Botao "Gerar Classes por IA" (reutiliza a funcao `handleGenerateClasses` que ja existe no componente, linhas 430-460)
- Apos gerar, exibe as classes sugeridas com checkboxes (mesma UI do fluxo novo cliente)
- Adicionalmente, lista completa das 45 classes NCL abaixo para selecao manual

### 6. Atualizacao do valor do contrato
- As classes selecionadas alimentam `selectedClasses` (estado ja existente)
- O calculo de valor (`getContractValue`/`getQuantityMultiplier`) ja usa `selectedClasses.length`
- O valor do contrato se atualiza automaticamente conforme classes selecionadas

### 7. Integracao no submit
- `formData.brand_name` ja e usado no `generateDocumentHtml` existente (linhas 2008-2010)
- `selectedClasses` ja e salvo como `suggested_classes` no contrato (linha 853)
- Nenhuma alteracao no submit necessaria

### 8. Reset do formulario
- Adicionar `clientBrands`, `useExistingBrand`, `existingBrandId` ao `resetForm()` (linha ~1040)

## Resumo visual da aba "Dados da Marca"

```text
+--------------------------------------------------+
| ( ) Marca ja registrada    ( ) Nova marca         |
+--------------------------------------------------+
|                                                    |
| [Se marca existente]                               |
| Select: [Escolha uma marca v]                      |
| Classes atuais: [25] [35] [41]                     |
|                                                    |
| [Se nova marca]                                    |
| Nome da Marca: [_______________]                   |
| Ramo de Atividade: [_______________]               |
| [Gerar Classes por IA]                             |
|                                                    |
| --- Selecionar Classes NCL ---                     |
| [ ] 01 - Produtos quimicos                         |
| [ ] 02 - Tintas e vernizes                         |
| [ ] 03 - Cosmeticos e produtos de limpeza          |
| ...                                                |
| [ ] 45 - Servicos juridicos e seguranca            |
+--------------------------------------------------+
```

## Impacto
- Nenhuma tabela nova ou migracao
- Reutiliza logica existente de sugestao por IA (`handleGenerateClasses`)
- Reutiliza `selectedClasses`, `suggestedClasses` e calculo de valor
- NCL_CLASS_DESCRIPTIONS copiado de `AssinarDocumento.tsx` (45 entradas)
- Nenhuma funcionalidade existente removida
