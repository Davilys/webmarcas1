

## Correção: Sincronização de Dados do Signatário no Novo Documento

### Problema Identificado

Na aba **Contratos** > **Novo Documento** > **Dados do Signatário**, quando um cliente é selecionado:
- **Nome do Representante Legal** mostra corretamente
- **CPF do Representante** NÃO sincroniza (ou fica incorreto)
- **CNPJ da Empresa** NÃO sincroniza (ou fica incorreto)
- **Endereço** sincroniza parcialmente (sem bairro)
- **Cidade/Estado** sincronizam corretamente

### Causa Raiz

A tabela `profiles` possui colunas **separadas** para:
- `cpf` (ex: "231.437.378-24")
- `cnpj` (ex: "25.201.774/0001-01")
- `neighborhood` (ex: "Jardim Sílvia Maria")

Mas o código atual:
1. A interface `Profile` (linha 33-44) NÃO inclui os campos `cpf`, `cnpj` e `neighborhood`
2. A função `handleProfileChange` (linha 773-820) usa `profile.cpf_cnpj` ao invés de `profile.cpf` e `profile.cnpj`
3. O useEffect de sincronização (linha 164-180) também usa a lógica incorreta com `cpf_cnpj`

### Solução Proposta (Isolada e Segura)

#### 1. Atualizar a Interface `Profile`
**Arquivo:** `src/components/admin/contracts/CreateContractDialog.tsx` (linhas 33-44)

```typescript
interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  cpf_cnpj: string | null;   // Legado - manter para compatibilidade
  cpf: string | null;        // NOVO: CPF separado
  cnpj: string | null;       // NOVO: CNPJ separado
  address: string | null;
  neighborhood: string | null; // NOVO: Bairro separado
  city: string | null;
  state: string | null;
  zip_code: string | null;
}
```

#### 2. Atualizar `handleProfileChange` para usar campos separados
**Arquivo:** `src/components/admin/contracts/CreateContractDialog.tsx` (linhas 773-820)

```typescript
const handleProfileChange = async (userId: string) => {
  const profile = profiles.find(p => p.id === userId);
  setSelectedProfile(profile || null);
  
  if (profile) {
    // Priorizar campos separados cpf/cnpj, fallback para cpf_cnpj legado
    const cpfValue = profile.cpf || 
      (profile.cpf_cnpj?.replace(/[^\d]/g, '').length === 11 ? profile.cpf_cnpj : '') || '';
    const cnpjValue = profile.cnpj || 
      (profile.cpf_cnpj?.replace(/[^\d]/g, '').length === 14 ? profile.cpf_cnpj : '') || '';
    
    // Construir endereço completo incluindo bairro
    const fullAddress = profile.neighborhood 
      ? `${profile.address || ''}, ${profile.neighborhood}`.replace(/^, /, '')
      : profile.address || '';
    
    // Buscar nome da marca dos processos do cliente
    let brandName = '';
    try {
      const { data: processes } = await supabase
        .from('brand_processes')
        .select('brand_name')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      
      if (processes?.brand_name) {
        brandName = processes.brand_name;
      }
    } catch (error) {
      console.log('Could not fetch brand name:', error);
    }
    
    setFormData(prev => ({ 
      ...prev, 
      user_id: userId,
      signatory_name: profile.full_name || '',
      signatory_cpf: cpfValue,
      signatory_cnpj: cnpjValue,
      company_address: fullAddress,
      company_city: profile.city || '',
      company_state: profile.state || '',
      company_cep: profile.zip_code || '',
      brand_name: brandName || prev.brand_name || '',
      subject: prev.subject || `Documento - ${profile.full_name || profile.email}`,
    }));
  } else {
    setFormData(prev => ({ ...prev, user_id: userId }));
  }
};
```

#### 3. Atualizar o useEffect de sincronização
**Arquivo:** `src/components/admin/contracts/CreateContractDialog.tsx` (linhas 164-180)

```typescript
useEffect(() => {
  // Auto-fill fields when profile is selected
  if (selectedProfile) {
    // Priorizar campos separados cpf/cnpj, fallback para cpf_cnpj legado
    const cpfValue = selectedProfile.cpf || 
      (selectedProfile.cpf_cnpj?.replace(/[^\d]/g, '').length === 11 ? selectedProfile.cpf_cnpj : '') || '';
    const cnpjValue = selectedProfile.cnpj || 
      (selectedProfile.cpf_cnpj?.replace(/[^\d]/g, '').length === 14 ? selectedProfile.cpf_cnpj : '') || '';
    
    // Construir endereço completo incluindo bairro
    const fullAddress = selectedProfile.neighborhood 
      ? `${selectedProfile.address || ''}, ${selectedProfile.neighborhood}`.replace(/^, /, '')
      : selectedProfile.address || '';
    
    setFormData(prev => ({
      ...prev,
      signatory_name: selectedProfile.full_name || '',
      signatory_cpf: cpfValue,
      signatory_cnpj: cnpjValue,
      company_address: fullAddress,
      company_city: selectedProfile.city || '',
      company_state: selectedProfile.state || '',
      company_cep: selectedProfile.zip_code || '',
    }));
  }
}, [selectedProfile]);
```

---

### Arquivo Modificado

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/contracts/CreateContractDialog.tsx` | Interface Profile expandida, lógica de sincronização atualizada |

---

### Análise de Risco

| Risco | Mitigação |
|-------|-----------|
| Quebrar TypeScript | Interface apenas expande campos (opcionais com null) |
| Dados legados sem campos separados | Fallback para `cpf_cnpj` mantido |
| Sobrescrever edições manuais | Sincronização só ocorre ao selecionar cliente |
| Regressão em fluxo de novo cliente | Fluxo usa estados separados (`personalData`), não afetado |

---

### Comportamento Esperado Após Correção

1. **Ao selecionar um cliente existente:**
   - Nome do Representante Legal: preenchido com `full_name`
   - CPF do Representante: preenchido com `cpf` (ou fallback `cpf_cnpj` se length=11)
   - CNPJ da Empresa: preenchido com `cnpj` (ou fallback `cpf_cnpj` se length=14)
   - Endereço: preenchido com `address, neighborhood` (endereço completo)
   - Cidade: preenchido com `city`
   - Estado: preenchido com `state`
   - CEP: preenchido com `zip_code`

2. **Edição manual:**
   - Admin pode ajustar qualquer campo após sincronização
   - Dados são salvos conforme preenchimento final

3. **Compatibilidade:**
   - Clientes antigos sem campos separados continuam funcionando via fallback

---

### Testes Recomendados
1. Criar Novo Documento > Selecionar cliente com CPF e CNPJ separados > Verificar sincronização
2. Criar Novo Documento > Selecionar cliente com apenas cpf_cnpj legado > Verificar fallback
3. Editar dados manualmente após sincronização > Gerar documento > Verificar valores
4. Verificar que fluxo "Criar novo cliente" continua funcionando

