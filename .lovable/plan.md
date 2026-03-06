

# Plano: Sugestão de Classes NCL para todos os planos

## Problema atual
O bloco "Orientação Jurídica" com upsell de classes NCL só aparece para o plano Essencial (`plan === 'essencial'`). Precisa aparecer também para Premium e Corporativo, com comportamento diferente:

- **Essencial**: adiciona valor por classe (já funciona)
- **Premium**: adiciona valor por classe (mesmo comportamento do Essencial, usando preço do plano Premium)
- **Corporativo**: seleciona classes mas **não adiciona valor** (registro ilimitado incluso)

## Mudanças

### `src/components/cliente/checkout/ContractStep.tsx`

1. **Remover a restrição `plan === 'essencial'`** no bloco de upsell (linha 250) — exibir para todos os planos.

2. **Ajustar `handleToggleClass`**: quando `plan === 'corporativo'`, não recalcular o valor (não chamar `onPaymentValueChange`). Apenas atualizar a lista de classes selecionadas.

3. **Ajustar o preço exibido por classe no upsell**:
   - Essencial: mostra `+R$ XXX` (preço unitário por classe conforme método de pagamento)
   - Premium: mostra `+R$ XXX` (preço unitário por classe)
   - Corporativo: mostra "Incluso" em vez de `+R$ XXX` (sem custo adicional)

4. **Texto do bloco**: manter o mesmo texto persuasivo de Orientação Jurídica para todos os planos. Para Corporativo, adicionar nota como "Incluso no seu plano" ao lado de cada classe.

### Resumo de alterações

| Arquivo | Mudança |
|---------|---------|
| `src/components/cliente/checkout/ContractStep.tsx` | Remover filtro `plan === 'essencial'`, ajustar lógica de preço por plano, exibir "Incluso" para corporativo |

Nenhuma outra alteração necessária — o mesmo componente é usado tanto no site `/registrar` quanto na área do cliente.

