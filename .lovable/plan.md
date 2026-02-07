

## Plano: Atualização Completa de Contratos ao Expirar Promoção

### Resumo

Quando a promoção expirar (automaticamente às sextas 23:59 ou via botão "Expirar Promoções"), o sistema deve:

1. Atualizar o **valor do contrato** de R$ 699,00 para R$ 1.194,00 ✓ (já implementado)
2. Atualizar o **método de pagamento** de `avista` para `boleto3x` (3x R$ 398,00)
3. Atualizar o **texto do contrato (contract_html)** substituindo a cláusula 5.1 pelo novo texto

---

### Novo Texto da Cláusula 5.1 (após expiração)

```text
5.1 Os pagamentos à CONTRATADA serão efetuados conforme a opção escolhida pelo CONTRATANTE:

• Pagamento à vista: R$ 1.194,00 (mil cento e noventa e quatro reais).
• Pagamento parcelado via boleto bancário: 3 (três) parcelas de R$ 398,00 (trezentos e noventa e oito reais).
• Pagamento parcelado via cartão de crédito: 6 (seis) parcelas de R$ 199,00 (cento e noventa e nove reais) sem incidência de juros.
```

---

### Alterações Necessárias

| Arquivo | Ação |
|---------|------|
| `supabase/functions/expire-promotion-price/index.ts` | Modificar - Adicionar lógica de atualização do contract_html e payment_method |

---

### Lógica de Atualização

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE EXPIRAÇÃO                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Buscar contratos elegíveis:                                      │
│     - contract_value = 699.00                                        │
│     - payment_method = 'avista'                                      │
│     - signature_status = 'not_signed'                                │
│     - asaas_payment_id IS NULL                                       │
│                                                                      │
│  2. Para cada contrato:                                              │
│     a) Atualizar contract_value para 1194.00                         │
│     b) Atualizar payment_method para 'boleto3x'                      │
│     c) Substituir cláusula 5.1 no contract_html                      │
│                                                                      │
│  3. Registrar log de execução                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Implementação no Edge Function

```typescript
// Texto novo da cláusula 5.1 após expiração
const NEW_CLAUSE_51 = `5.1 Os pagamentos à CONTRATADA serão efetuados conforme a opção escolhida pelo CONTRATANTE:

• Pagamento à vista: R$ 1.194,00 (mil cento e noventa e quatro reais).
• Pagamento parcelado via boleto bancário: 3 (três) parcelas de R$ 398,00 (trezentos e noventa e oito reais).
• Pagamento parcelado via cartão de crédito: 6 (seis) parcelas de R$ 199,00 (cento e noventa e nove reais) sem incidência de juros.`;

// Função para atualizar o contract_html
function updateContractClause51(contractHtml: string): string {
  // Regex para encontrar a cláusula 5.1 existente (até 5.2)
  const clause51Regex = /5\.1 Os pagamentos à CONTRATADA[\s\S]*?(?=5\.2 Taxas do INPI)/;
  
  return contractHtml.replace(clause51Regex, NEW_CLAUSE_51 + '\n');
}

// Para cada contrato elegível:
for (const contract of eligibleContracts) {
  // Atualizar texto da cláusula 5.1
  const updatedHtml = updateContractClause51(contract.contract_html);
  
  // Atualizar todos os campos
  await supabase
    .from('contracts')
    .update({ 
      contract_value: 1194.00,
      payment_method: 'boleto3x',  // Novo: 3x R$398
      contract_html: updatedHtml   // Novo: texto atualizado
    })
    .eq('id', contract.id);
}
```

---

### Geração da Cobrança (create-post-signature-payment)

Após assinatura, a Edge Function `create-post-signature-payment` já está configurada para:

1. Ler o `contract_value` do banco (1194.00)
2. Ler o `payment_method` do banco (boleto3x)
3. Gerar cobrança no Asaas: **3x de R$ 398,00**

O cálculo de parcela será:
```typescript
// Para boleto3x com contract_value = 1194:
installmentCount = 3
installmentValue = 1194 / 3 = 398.00
```

---

### Padrão do Regex de Substituição

```text
ANTES (texto promocional):
┌────────────────────────────────────────────────────────────────┐
│ 5.1 Os pagamentos à CONTRATADA serão efetuados...              │
│ • Pagamento à vista via PIX: R$ 699,00 (seiscentos e noventa   │
│   e nove reais) - com 43% de desconto sobre o valor integral   │
│   de R$ 1.230,00.                                              │
└────────────────────────────────────────────────────────────────┘

DEPOIS (preço cheio com opções):
┌────────────────────────────────────────────────────────────────┐
│ 5.1 Os pagamentos à CONTRATADA serão efetuados conforme a      │
│ opção escolhida pelo CONTRATANTE:                              │
│                                                                │
│ • Pagamento à vista: R$ 1.194,00 (mil cento e noventa e        │
│   quatro reais).                                               │
│ • Pagamento parcelado via boleto bancário: 3 (três) parcelas   │
│   de R$ 398,00 (trezentos e noventa e oito reais).             │
│ • Pagamento parcelado via cartão de crédito: 6 (seis)          │
│   parcelas de R$ 199,00 (cento e noventa e nove reais)         │
│   sem incidência de juros.                                     │
└────────────────────────────────────────────────────────────────┘
```

---

### Verificação de Segurança

| Item | Status |
|------|--------|
| Contratos assinados | Não afetados (signature_status = 'signed') |
| Contratos pagos | Não afetados (asaas_payment_id != NULL) |
| Contratos parcelados originais | Não afetados (payment_method != 'avista') |
| Integração Asaas | Mantida - usa campo payment_method e contract_value |
| Visualização do contrato | Atualizada via contract_html |
| Download PDF | Usa contract_html atualizado |

---

### Campos Atualizados por Contrato

| Campo | Valor Anterior | Novo Valor |
|-------|----------------|------------|
| `contract_value` | 699.00 | 1194.00 |
| `payment_method` | avista | boleto3x |
| `contract_html` | Cláusula 5.1 com PIX 699 | Cláusula 5.1 com opções 1194/398x3/199x6 |

---

### Seção Técnica

**Regex de substituição:**
```javascript
// Captura desde "5.1 Os pagamentos à CONTRATADA" até antes de "5.2 Taxas do INPI"
const regex = /5\.1 Os pagamentos à CONTRATADA[\s\S]*?(?=5\.2 Taxas do INPI)/;
```

**Tratamento de casos especiais:**
- Se o contract_html for NULL: pular a atualização do HTML (manter apenas valor e método)
- Se o regex não encontrar match: manter o HTML original

**Arquivo a modificar:**
- `supabase/functions/expire-promotion-price/index.ts`
  - Adicionar busca do campo `contract_html` no SELECT
  - Adicionar constante `NEW_CLAUSE_51` com o novo texto
  - Adicionar função `updateContractClause51(html)`
  - Modificar UPDATE para incluir `payment_method` e `contract_html`

