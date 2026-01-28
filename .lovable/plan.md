
# Plano: Corrigir Substituição de Variáveis nos Documentos (Procuração, Distrato)

## Diagnóstico do Problema

Ao criar um novo documento (Procuração, Distrato com Multa, Distrato sem Multa) para um cliente existente no CRM, as variáveis como `{{nome_empresa}}`, `{{endereco_empresa}}`, `{{cnpj}}`, `{{nome_representante}}`, `{{cpf_representante}}` **não estão sendo substituídas** pelos dados reais do cliente.

### Causa Raiz

O código em `generateDocumentHtml()` (linhas 356-373 em `CreateContractDialog.tsx`) está:
1. **Ignorando o template do banco de dados** (`selectedTemplate?.content`)
2. Usando a função `generateDocumentContent()` que gera um template hardcoded em JavaScript (arquivo `documentTemplates.ts`), que **não corresponde ao template salvo no banco**

### Variáveis nos Templates do Banco

| Tipo Documento | Variáveis no Template do Banco |
|----------------|--------------------------------|
| Procuração | `{{nome_empresa}}`, `{{endereco_empresa}}`, `{{cidade}}`, `{{estado}}`, `{{cep}}`, `{{cnpj}}`, `{{nome_representante}}`, `{{cpf_representante}}`, `{{data_procuracao}}` |
| Distrato | `{{nome_empresa}}`, `{{endereco_empresa}}`, `{{cidade}}`, `{{estado}}`, `{{cep}}`, `{{cnpj}}`, `{{nome_representante}}`, `{{cpf_representante}}`, `{{marca}}`, `{{data_distrato}}`, `{{numero_parcelas}}`, `{{valor_multa}}` |

### Código Problemático Atual

```javascript
// Linha 356-373 - CreateContractDialog.tsx
const vars = {
  nome_empresa: selectedProfile?.company_name || ...,
  cnpj: ...,
  endereco: ...,  // ❌ Template usa "endereco_empresa", não "endereco"
  ...
};
return generateDocumentContent(formData.document_type, vars);
// ❌ Ignora selectedTemplate?.content e usa template hardcoded
```

---

## Solução Proposta

### Criar Função para Substituir Variáveis no Template do Banco

Modificar `generateDocumentHtml()` para substituir as variáveis diretamente no `selectedTemplate?.content`, sem usar `generateDocumentContent()`.

### Arquivo a Modificar

`src/components/admin/contracts/CreateContractDialog.tsx`

### Alterações no Código

**Substituir linhas 356-373 por:**

```javascript
// For other document types (procuracao, distrato) using database templates
if (selectedTemplate?.content) {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  const addressParts = parseAddressForNeighborhood(selectedProfile?.address || formData.company_address || '');
  const fullAddress = `${addressParts.mainAddress}${addressParts.neighborhood ? ', ' + addressParts.neighborhood : ''}`;
  
  // Replace all template variables with client data
  let result = selectedTemplate.content
    // Company/Personal data
    .replace(/\{\{nome_empresa\}\}/g, selectedProfile?.company_name || formData.signatory_name || selectedProfile?.full_name || '')
    .replace(/\{\{endereco_empresa\}\}/g, fullAddress)
    .replace(/\{\{endereco\}\}/g, fullAddress)
    .replace(/\{\{cidade\}\}/g, selectedProfile?.city || formData.company_city || '')
    .replace(/\{\{estado\}\}/g, selectedProfile?.state || formData.company_state || '')
    .replace(/\{\{cep\}\}/g, selectedProfile?.zip_code || formData.company_cep || '')
    .replace(/\{\{cnpj\}\}/g, formData.signatory_cnpj || (selectedProfile?.cpf_cnpj?.replace(/[^\d]/g, '').length === 14 ? selectedProfile.cpf_cnpj : '') || '')
    // Representative data
    .replace(/\{\{nome_representante\}\}/g, formData.signatory_name || selectedProfile?.full_name || '')
    .replace(/\{\{cpf_representante\}\}/g, formData.signatory_cpf || (selectedProfile?.cpf_cnpj?.replace(/[^\d]/g, '').length === 11 ? selectedProfile.cpf_cnpj : '') || '')
    // Contact info
    .replace(/\{\{email\}\}/g, selectedProfile?.email || '')
    .replace(/\{\{telefone\}\}/g, selectedProfile?.phone || '')
    // Brand and distrato specifics
    .replace(/\{\{marca\}\}/g, effectiveBrandName)
    .replace(/\{\{data_procuracao\}\}/g, currentDate)
    .replace(/\{\{data_distrato\}\}/g, currentDate)
    .replace(/\{\{valor_multa\}\}/g, formData.penalty_value || '0,00')
    .replace(/\{\{numero_parcelas\}\}/g, formData.penalty_installments || '1');
  
  return result;
}

// Fallback to generateDocumentContent only if no template selected
const vars = {
  nome_empresa: selectedProfile?.company_name || formData.signatory_name || selectedProfile?.full_name || '',
  cnpj: formData.signatory_cnpj || (selectedProfile?.cpf_cnpj?.replace(/[^\d]/g, '').length === 14 ? selectedProfile.cpf_cnpj : '') || '',
  endereco: addressParts.mainAddress || selectedProfile?.address || formData.company_address || '',
  cidade: selectedProfile?.city || formData.company_city || '',
  estado: selectedProfile?.state || formData.company_state || '',
  cep: selectedProfile?.zip_code || formData.company_cep || '',
  nome_representante: formData.signatory_name || selectedProfile?.full_name || '',
  cpf_representante: formData.signatory_cpf || (selectedProfile?.cpf_cnpj?.replace(/[^\d]/g, '').length === 11 ? selectedProfile.cpf_cnpj : '') || '',
  email: selectedProfile?.email || '',
  telefone: selectedProfile?.phone || '',
  marca: effectiveBrandName,
  valor_multa: formData.penalty_value || '',
  numero_parcela: formData.penalty_installments || '1',
};

return generateDocumentContent(formData.document_type, vars);
```

---

## Análise de Risco

| Risco | Mitigação |
|-------|-----------|
| Alteração pode afetar contratos padrão (Registro de Marca) | A lógica para contratos "registro de marca" permanece intacta (linhas 314-345) |
| Variáveis diferentes entre templates | Código substitui todas as variáveis conhecidas, ignorando as não encontradas |
| Fallback para templates inexistentes | Mantém `generateDocumentContent()` como fallback caso `selectedTemplate?.content` esteja vazio |

---

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/contracts/CreateContractDialog.tsx` | Modificar função `generateDocumentHtml()` (linhas 346-373) |

---

## Resultado Esperado

**Antes:**
```
{{nome_empresa}}, empresa brasileira... sede na {{endereco_empresa}}...
Devidamente inscrito no CNPJ sob Nº {{cnpj}}...
```

**Depois:**
```
Laudemir Rodrigues Valente, empresa brasileira... sede na Rua Exemplo, 123 - Centro...
Devidamente inscrito no CNPJ sob Nº 12.345.678/0001-90...
```

---

## Estimativa

- **Complexidade**: Baixa
- **Arquivos alterados**: 1
- **Linhas modificadas**: ~40
- **Risco de regressão**: Baixo (alteração isolada na função `generateDocumentHtml()`)
