

# Fix: Plan-Specific Payment Options + Auto-Fill Document Value

## Problems Identified

1. **PlanSelectionStep**: Corporativo still shows R$1.194,00 instead of R$1.621,00
2. **PaymentStep (checkout form)**: Recurring plans (Premium/Corporativo) only show "Cartão de Crédito Recorrente" — need to add "Boleto Recorrente" option too
3. **CreateContractDialog (admin)**: Payment section always shows Essencial options (PIX R$699, Cartão 6x R$199, Boleto 3x R$399) regardless of template selected — needs plan-specific payment options:
   - **Padrão/Essencial**: PIX R$699 / Cartão 6x R$199 / Boleto 3x R$399
   - **Premium**: Cartão Recorrente R$398/mês / Boleto Recorrente R$398/mês
   - **Corporativo**: Cartão Recorrente R$1.621/mês / Boleto Recorrente R$1.621/mês
4. **CreateContractDialog**: Document value not auto-filled based on selected template

## Changes

### 1. `src/components/cliente/checkout/PlanSelectionStep.tsx`
- Line 57: Change `"R$ 1.194,00"` → `"R$ 1.621,00"`

### 2. `src/components/cliente/checkout/PaymentStep.tsx`
- Lines 54-67: Add a second recurring option `recorrente_boleto` alongside `recorrente_cartao`
- Remove auto-select of `recorrente_cartao` (let user choose between card and boleto)
- Both options show the same recurring value (R$398 for Premium, R$1.621 for Corporativo)

### 3. `src/components/admin/contracts/CreateContractDialog.tsx`
Major changes:
- **Detect plan type from template name**: Add logic to determine if selected template is Premium or Corporativo based on name
- **Plan-specific payment options**: Replace the current hardcoded Essencial payment section (lines 2720-2842) with conditional rendering:
  - If template is Premium → show Cartão Recorrente R$398 + Boleto Recorrente R$398
  - If template is Corporativo → show Cartão Recorrente R$1.621 + Boleto Recorrente R$1.621
  - If template is Padrão/Essencial → show current 3 options (PIX/Cartão 6x/Boleto 3x)
- **Expand `paymentMethod` type**: Add `'recorrente_cartao' | 'recorrente_boleto'` to the state type
- **Update `getContractValue`/`getUnitValue`/`getPaymentDescription`**: Handle recurring payment methods with correct values
- **Auto-fill `contract_value`**: When template is selected, auto-set `formData.contract_value` based on plan type (699 for Padrão, 398 for Premium, 1621 for Corporativo)
- **Reset payment method on template change**: Clear `paymentMethod` when switching templates since options differ per plan

### 4. Edge function `create-asaas-payment`
- Verify it handles `recorrente_boleto` payment method for Corporativo (create SUBSCRIPTION with billingType BOLETO at R$1.621/mês)

## Files Modified
1. `src/components/cliente/checkout/PlanSelectionStep.tsx`
2. `src/components/cliente/checkout/PaymentStep.tsx`
3. `src/components/admin/contracts/CreateContractDialog.tsx`
4. `supabase/functions/create-asaas-payment/index.ts` (if needed for boleto recurring)

