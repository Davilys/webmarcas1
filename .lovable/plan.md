

## Correção da Formatação de Múltiplas Marcas no Contrato

### Problema Identificado

Atualmente, o sistema adiciona uma "CLÁUSULA DE MÚLTIPLAS MARCAS" separada no final do contrato, antes das assinaturas. Isso está errado conforme as imagens de referência.

### Correções Necessárias

#### 1. Cláusula 10.1 - Formato Correto

**Atual (errado):**
```
10.1 Fica pactuada entre as partes a prestação dos serviços de acompanhamento e vigilância do(s) processo(s) referentes à marca {{marca}}.
```

**Correto (múltiplas marcas):**
```
10.1 Fica pactuada entre as partes a prestação dos serviços de acompanhamento e vigilância do(s) processo(s) referentes à marca: 1. Marca: **teste 1** - Classe NCL: **25**. 2. Marca: **teste 2** - Classe NCL: **8**.
```

#### 2. Cláusula 5.1 - Adicionar Valor Total

**Atual:**
```
• Pagamento à vista via PIX: R$ 699,00 (seiscentos e noventa e nove reais) - com 43% de desconto sobre o valor integral de R$ 1.230,00.
```

**Correto (múltiplas marcas):**
```
• Pagamento à vista via PIX: R$ 699,00 (seiscentos e noventa e nove reais) - com 43% de desconto sobre o valor integral de R$ 1.230,00. Valor total de 2 marcas: R$ 1.398,00.
```

---

### Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useContractTemplate.ts` | Refatorar lógica de substituição de variáveis |

---

### Detalhamento Técnico

#### 1. Remover a função `generateMultipleBrandsClause`

A cláusula separada no final será removida completamente.

#### 2. Modificar `replaceContractVariables`

**Nova função para formatar marcas inline:**

```typescript
const formatMultipleBrandsInline = (brands: BrandItem[]): string => {
  if (!brands || brands.length === 0) return '';
  
  return brands.map((brand, index) => 
    `${index + 1}. Marca: <strong>${brand.brandName}</strong> - Classe NCL: <strong>${brand.nclClass || 'A definir'}</strong>`
  ).join('. ') + '.';
};
```

**Atualizar substituição da marca na cláusula 10.1:**

```typescript
// Se houver múltiplas marcas, usar formato inline
if (data.multipleBrands && data.multipleBrands.length > 1) {
  const brandsInline = formatMultipleBrandsInline(data.multipleBrands);
  result = result.replace(/\{\{marca\}\}/g, brandsInline);
} else {
  result = result.replace(/\{\{marca\}\}/g, brandData.brandName);
}
```

**Atualizar função `getPaymentDetails` para incluir valor total:**

```typescript
const getPaymentDetails = () => {
  const brandCount = data.multipleBrands?.length || 1;
  const totalSuffix = brandCount > 1 
    ? ` Valor total de ${brandCount} marcas: R$ ${(699 * brandCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
    : '';
  
  switch (paymentMethod) {
    case 'avista':
      return `• Pagamento à vista via PIX: R$ 699,00 (seiscentos e noventa e nove reais) - com 43% de desconto sobre o valor integral de R$ 1.230,00.${totalSuffix}`;
    case 'cartao6x':
      const parcelaCartao = brandCount > 1 
        ? ` Valor total de ${brandCount} marcas: R$ ${(1194 * brandCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
        : '';
      return `• Pagamento parcelado no Cartão de Crédito: 6x de R$ 199,00 (cento e noventa e nove reais) = Total: R$ 1.194,00 - sem juros.${parcelaCartao}`;
    case 'boleto3x':
      const parcelaBoleto = brandCount > 1 
        ? ` Valor total de ${brandCount} marcas: R$ ${(1197 * brandCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
        : '';
      return `• Pagamento parcelado via Boleto Bancário: 3x de R$ ${(399 * brandCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (trezentos e noventa e nove reais) = Total: R$ 1.197,00.${parcelaBoleto}`;
    default:
      return `• Forma de pagamento a ser definida.`;
  }
};
```

**Remover inserção da cláusula separada:**

```typescript
// REMOVER este bloco:
if (data.multipleBrands && data.multipleBrands.length > 1) {
  result = result.replace(
    /Por estarem justas e contratadas/,
    `${generateMultipleBrandsClause(data.multipleBrands)}Por estarem justas e contratadas`
  );
}
```

---

### Resultado Visual

**Cláusula 10.1 (com 2 marcas):**
> 10.1 Fica pactuada entre as partes a prestação dos serviços de acompanhamento e vigilância do(s) processo(s) referentes à marca: 1. Marca: **teste 1** - Classe NCL: **25**. 2. Marca: **teste 2** - Classe NCL: **8**.

**Cláusula 5.1 (PIX com 2 marcas):**
> • Pagamento à vista via PIX: R$ 699,00 (seiscentos e noventa e nove reais) - com 43% de desconto sobre o valor integral de R$ 1.230,00. Valor total de 2 marcas: R$ 1.398,00.

---

### Retrocompatibilidade

| Cenário | Comportamento |
|---------|---------------|
| 1 marca apenas | Exatamente como hoje (sem alteração) |
| Múltiplas marcas | Formato inline na cláusula 10.1 + valor total na 5.1 |
| Contratos existentes | Nenhum impacto |

