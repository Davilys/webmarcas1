
## Objetivo
Corrigir com urgência o problema em que, ao gerar o link de assinatura de documentos (principalmente **“Procuração INPI - Padrão”**), os placeholders como `{{nome_empresa}}`, `{{cnpj}}`, `{{endereco_empresa}}` etc. **não são substituídos** pelos dados do cliente selecionado — garantindo que a correção seja **isolada**, com **baixo risco** e **sem afetar** outras partes do projeto.

---

## Diagnóstico (causa raiz confirmada)
Ao analisar `src/components/admin/contracts/CreateContractDialog.tsx`, identifiquei que o sistema está classificando incorretamente alguns templates como “Contrato padrão” por causa do trecho:

- `isStandardContract` / `isStandardTemplate` / `isStandardContractTemplate` usam:
  - `selectedTemplate.name.toLowerCase().includes('padrão')`

Isso faz com que **“Procuração INPI - Padrão”** caia no fluxo de “Contrato padrão” (Registro de Marca) e use `replaceContractVariables(...)`, que **não substitui** `{{nome_empresa}}`, `{{cnpj}}`, etc.

Evidência direta:
- No banco, o template **Procuração INPI - Padrão** contém placeholders do tipo:
  - `{{nome_empresa}}`, `{{endereco_empresa}}`, `{{cidade}}`, `{{estado}}`, `{{cep}}`, `{{cnpj}}`, `{{nome_representante}}`, `{{cpf_representante}}`
- Além disso, esse template usa `{{nome_representante}}` (não `{{nome_representante}}`), o que exige substituição compatível.

Resultado: o HTML do documento é salvo no `contracts.contract_html` **sem substituição**, e a tela de assinatura exibe os placeholders (como na imagem que você enviou).

---

## Estratégia de correção (mínima, segura e sem regressões)
### A) Corrigir a detecção de “Contrato padrão” (Registro de Marca) para não depender de “padrão”
**Arquivo:** `src/components/admin/contracts/CreateContractDialog.tsx`

1) Criar uma variável única e consistente para o tipo do template selecionado:
- `templateDocumentType = selectedTemplate ? getDocumentTypeFromTemplateName(selectedTemplate.name) : formData.document_type`

2) Reescrever as flags que hoje usam `includes('padrão')` para serem verdadeiras **apenas** quando:
- `templateDocumentType === 'contract'`
- e o template for realmente “Registro de Marca” (por nome)

Exemplo do que será ajustado (conceito):
- Antes: `includes('registro de marca') || includes('padrão')`
- Depois: `templateDocumentType === 'contract' && includes('registro de marca')`

Isso deve ser aplicado nos 3 pontos do arquivo:
- no `generateDocumentHtml()` (detecção do “standard contract”)
- no cálculo de `contractValue` e `payment_method`
- no auto-gerar link quando `sendLink === false` (regra “standard contract template”)

**Impacto esperado:**  
- “Procuração INPI - Padrão” e “Distratos - Padrão” deixam de entrar no fluxo de “Contrato padrão”, passando a usar o fluxo correto de substituição.

---

### B) Tornar a substituição de variáveis mais robusta (especialmente Procuração)
Ainda em `generateDocumentHtml()`:
1) Manter o fluxo atual “não-contrato” que usa `selectedTemplate.content` e faz `.replace(...)`, mas:
2) Corrigir o placeholder do representante para suportar os dois nomes:
- `{{nome_representante}}` (que aparece na Procuração)
- `{{nome_representante}}` (que aparece nos Distratos)

3) Melhorar os regex para suportar espaços dentro do placeholder (evita falhas se alguém editar templates no futuro):
- Ex: `{{ nome_empresa }}` também deve funcionar.

Implementação recomendada:
- Criar helper local `replaceVar(template, key, value)` com regex case-insensitive e tolerante a espaços:
  - `new RegExp('\\{\\{\\s*' + key + '\\s*\\}\\}', 'gi')`

Aplicar para:
- `nome_empresa`, `endereco_empresa`, `cidade`, `estado`, `cep`, `cnpj`, `email`, `telefone`
- `nome_representante` **e** `nome_representante`
- `cpf_representante`
- `marca`, `data_procuracao`, `data_distrato`, `valor_multa`, `numero_parcelas`

**Impacto esperado:**
- Procuração passa a preencher todos os dados do cliente corretamente.
- Distratos continuam funcionando e ficam mais resistentes.
- Não mexe no template de “Registro de Marca” (contrato) nem na lógica de `replaceContractVariables` usada pelo fluxo padrão.

---

## Testes obrigatórios antes de publicar (end-to-end)
### 1) Teste por tipo de documento (Admin → gerar link → página de assinatura)
Na rota `/admin/contratos`, para um cliente que tenha:
- `company_name`, `cpf_cnpj`, `address`, `city`, `state`, `zip_code`, `email`, `phone`

Gerar link para:
1. **Procuração INPI - Padrão**
   - Confirmar na página `/assinar/:token` que não existe nenhum `{{...}}` visível
   - Confirmar que `nome_empresa`, `cnpj`, `endereco_empresa`, `nome_representante`, `cpf_representante` foram preenchidos
2. **Distrato com Multa - Padrão**
   - Confirmar substituição de `{{marca}}`, `{{valor_multa}}`, `{{numero_parcelas}}`, etc.
3. **Distrato sem Multa - Padrão**
4. **Contrato Registro de Marca**
   - Confirmar que continua usando o fluxo padrão (sem regressão)
   - Confirmar valor e método de pagamento continuam coerentes

### 2) Teste de regressão do “auto-gerar link”
- Verificar que o auto-gerar link **só acontece** para o contrato de Registro de Marca (document_type=contract), e não para procuração/distrato.

### 3) Teste rápido de “race condition”
- Trocar rapidamente o template e clicar “Gerar link”
- Confirmar que o documento gerado corresponde ao template selecionado e com dados preenchidos

---

## Análise de risco (antes de publicar)
### Risco principal
- Alterar detecção de “template padrão” poderia impactar a automação de pagamento/link do “Registro de Marca”.

### Mitigação
- Restringir “standard contract” por `templateDocumentType === 'contract'` + “registro de marca”.
- Não alterar `replaceContractVariables`.
- Mudança isolada em **um arquivo** (`CreateContractDialog.tsx`) e apenas em regras condicionais + substituição de placeholders.

### Risco residual
- Baixo. A correção alinha a lógica ao comportamento esperado e evita que Procuração/Distrato entrem no fluxo errado.

---

## Entrega (o que será modificado)
**Arquivo único:**
- `src/components/admin/contracts/CreateContractDialog.tsx`

**Mudanças:**
1) Ajustar flags de “padrão” para não capturar Procuração/Distrato
2) Robustecer substituição de variáveis e incluir suporte a `{{nome_representante}}`

---

## Resultado esperado
- Ao gerar link de **Procuração INPI - Padrão**, a página de assinatura mostrará o documento já preenchido com os dados do cliente, sem placeholders `{{...}}`.
- Os demais modelos (Contrato Registro de Marca, Distratos) permanecem funcionando e/ou ficam mais consistentes.
