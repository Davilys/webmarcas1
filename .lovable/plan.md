

## Plano: Contrato com Múltiplas Marcas no CRM

### Resumo Executivo

Implementar a funcionalidade que permite registrar **múltiplas marcas em um único contrato** no CRM Admin, mantendo total retrocompatibilidade com o sistema atual (1 marca = comportamento idêntico).

---

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                  FLUXO MÚLTIPLAS MARCAS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Admin: CRM → Contratos → Novo Contrato                         │
│          ↓                                                      │
│  Aba "Dados da Marca": Seletor 1-10 marcas                      │
│          ↓                                                      │
│  Gera N blocos dinâmicos (Nome, Ramo, Classe)                   │
│          ↓                                                      │
│  Aba "Pagamento": Resumo automático (Qtd × Valor)               │
│          ↓                                                      │
│  Contrato gerado com cláusula de múltiplas marcas               │
│          ↓                                                      │
│  Valor total enviado ao Asaas                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Arquivos a Modificar

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/components/admin/contracts/CreateContractDialog.tsx` | Adicionar UI de múltiplas marcas + cálculo |
| `src/hooks/useContractTemplate.ts` | Adicionar suporte a array de marcas na substituição |

---

### Detalhamento Técnico

#### 1. Estado para Múltiplas Marcas

Adicionar ao `CreateContractDialog.tsx`:

```typescript
// Interface para cada marca
interface BrandItem {
  brandName: string;
  businessArea: string;
  nclClass: string; // Classe NCL (Nice Classification)
}

// Estado: quantidade e array de marcas
const [brandQuantity, setBrandQuantity] = useState(1);
const [brandsArray, setBrandsArray] = useState<BrandItem[]>([
  { brandName: '', businessArea: '', nclClass: '' }
]);
```

#### 2. UI na Aba "Dados da Marca"

Adicionar seletor numérico ACIMA dos campos atuais:

```typescript
// Seletor de quantidade (1-10)
<Select value={brandQuantity.toString()} onValueChange={(v) => {
  const qty = parseInt(v);
  setBrandQuantity(qty);
  // Ajustar array de marcas
  if (qty > brandsArray.length) {
    setBrandsArray([...brandsArray, ...Array(qty - brandsArray.length).fill({ 
      brandName: '', businessArea: '', nclClass: '' 
    })]);
  } else {
    setBrandsArray(brandsArray.slice(0, qty));
  }
}}>
  {[1,2,3,4,5,6,7,8,9,10].map(n => (
    <SelectItem key={n} value={n.toString()}>
      {n} marca{n > 1 ? 's' : ''}
    </SelectItem>
  ))}
</Select>

// Blocos dinâmicos para cada marca
{brandsArray.map((brand, index) => (
  <div key={index} className="border rounded-lg p-4 space-y-3">
    <h4>Marca #{index + 1}</h4>
    <Input placeholder="Nome da Marca" value={brand.brandName} ... />
    <Input placeholder="Ramo de Atividade" value={brand.businessArea} ... />
    <Select placeholder="Classe NCL">
      {/* Classes 1-45 */}
    </Select>
  </div>
))}
```

#### 3. Cálculo Automático de Valor

Modificar a função `getContractValue()`:

```typescript
const getContractValue = (): number | null => {
  if (!paymentMethod) return null;
  const quantity = brandQuantity;
  
  switch (paymentMethod) {
    case 'avista': 
      return 699 * quantity;      // PIX: 699 × N
    case 'cartao6x': 
      return 1194 * quantity;     // Cartão: 1194 × N
    case 'boleto3x': 
      return 1197 * quantity;     // Boleto: 1197 × N
    default: 
      return null;
  }
};

// Descrição de pagamento atualizada
const getPaymentDescription = () => {
  if (!paymentMethod) return 'Nenhuma (sem cobrança)';
  const qty = brandQuantity;
  const suffix = qty > 1 ? ` (${qty} marcas)` : '';
  
  switch (paymentMethod) {
    case 'avista': 
      return `PIX à vista - R$ ${(699 * qty).toLocaleString('pt-BR')}${suffix}`;
    case 'cartao6x': 
      return `Cartão 6x de R$ ${(199 * qty).toLocaleString('pt-BR')} = R$ ${(1194 * qty).toLocaleString('pt-BR')}${suffix}`;
    case 'boleto3x': 
      return `Boleto 3x de R$ ${(399 * qty).toLocaleString('pt-BR')} = R$ ${(1197 * qty).toLocaleString('pt-BR')}${suffix}`;
    default: 
      return 'Nenhuma (sem cobrança)';
  }
};
```

#### 4. Resumo na Aba Pagamento

Adicionar card de resumo:

```typescript
{brandQuantity > 1 && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
    <h4 className="font-semibold text-blue-800">Resumo do Contrato</h4>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <span>Quantidade de marcas:</span>
      <span className="font-medium">{brandQuantity}</span>
      <span>Valor unitário:</span>
      <span className="font-medium">
        {paymentMethod === 'avista' ? 'R$ 699,00' : 
         paymentMethod === 'cartao6x' ? 'R$ 1.194,00' : 
         'R$ 1.197,00'}
      </span>
      <span>Total do contrato:</span>
      <span className="font-bold text-primary">
        R$ {getContractValue()?.toLocaleString('pt-BR')}
      </span>
    </div>
  </div>
)}
```

#### 5. Cláusula Automática no Contrato

Modificar `replaceContractVariables` em `useContractTemplate.ts`:

```typescript
// Adicionar parâmetro opcional para múltiplas marcas
interface ContractData {
  personalData: {...};
  brandData: {...};
  paymentMethod: string;
  multipleBrands?: BrandItem[]; // NOVO
}

// Na função, gerar cláusula de múltiplas marcas
const generateMultipleBrandsClause = (brands: BrandItem[]): string => {
  if (!brands || brands.length <= 1) return '';
  
  let clause = `\n\nCLÁUSULA DE MÚLTIPLAS MARCAS\n\n`;
  clause += `O presente contrato contempla o pedido de registro das seguintes marcas:\n\n`;
  
  brands.forEach((brand, index) => {
    clause += `${index + 1}. Marca: ${brand.brandName}\n`;
    clause += `   Classe NCL: ${brand.nclClass || 'A definir'}\n`;
    clause += `   Ramo: ${brand.businessArea}\n\n`;
  });
  
  return clause;
};

// Inserir antes da seção de assinaturas
result = result.replace(
  /Por estarem justas e contratadas/,
  `${generateMultipleBrandsClause(data.multipleBrands || [])}Por estarem justas e contratadas`
);
```

#### 6. Geração do Contrato

Atualizar `generateNewClientContractHtml`:

```typescript
const generateNewClientContractHtml = () => {
  const template = selectedTemplate?.content || '';
  
  return replaceContractVariables(template, {
    personalData: {...},
    brandData: brandQuantity === 1 
      ? brandData 
      : { ...brandsArray[0], hasCNPJ: brandData.hasCNPJ, cnpj: brandData.cnpj, companyName: brandData.companyName },
    paymentMethod,
    multipleBrands: brandQuantity > 1 ? brandsArray : undefined, // NOVO
  });
};
```

---

### Retrocompatibilidade Garantida

| Cenário | Comportamento |
|---------|---------------|
| `brandQuantity = 1` | Fluxo idêntico ao atual |
| Contrato existente | Nenhuma alteração |
| Valor unitário | Usa preços do sistema existente |
| Template base | Não é modificado |
| Asaas | Apenas valor total diferente |

---

### Validação

Adicionar validação para múltiplas marcas:

```typescript
const validateBrandsArray = (): boolean => {
  if (brandQuantity === 1) return true; // Usa validação existente
  
  for (let i = 0; i < brandQuantity; i++) {
    const brand = brandsArray[i];
    if (!brand.brandName || brand.brandName.length < 2) {
      setValidationErrors({ [`brand_${i}_name`]: 'Nome da marca obrigatório' });
      return false;
    }
    if (!brand.businessArea || brand.businessArea.length < 3) {
      setValidationErrors({ [`brand_${i}_area`]: 'Ramo de atividade obrigatório' });
      return false;
    }
  }
  return true;
};
```

---

### O que NÃO será alterado

| Item | Status |
|------|--------|
| Banco de dados | Não alterado |
| Tabela contracts | Não alterada |
| Tabela brand_processes | Não alterada |
| Edge Functions | Não alteradas |
| Integração Asaas | Apenas valor numérico diferente |
| Contratos antigos | Não afetados |
| Fluxo público (checkout) | Não alterado |
| Permissões | Não alteradas |
| Templates existentes | Não alterados |

---

### Resultado Final

Após a implementação:

1. Admin acessa CRM → Contratos → Novo Contrato
2. Seleciona "Criar novo cliente"
3. Na aba "Dados da Marca": escolhe quantidade (1-10)
4. Sistema gera N blocos para preenchimento
5. Na aba "Pagamento": vê resumo com valor total calculado
6. Contrato gerado inclui cláusula listando todas as marcas
7. Cobrança criada no Asaas com valor correto

Se quantidade = 1, tudo funciona **exatamente** como hoje.

