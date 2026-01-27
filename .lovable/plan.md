
# Plano: Unificação dos Formulários de Registro

## Diagnóstico Completo

### Formulários Identificados

| Localização | Arquivo | Etapas | Componentes |
|-------------|---------|--------|-------------|
| **Home Page** | `RegistrationFormSection.tsx` | 4 etapas | Código inline (875 linhas) |
| **Landing Page (/registrar)** | `Registrar.tsx` | 5 etapas | Componentes modulares |
| **Portal Cliente** | `RegistrarMarca.tsx` | 5 etapas | Componentes modulares |

### Diferenças Críticas

```text
┌────────────────────────────────────────────────────────────────────────┐
│  RegistrationFormSection.tsx (HOME - DESATUALIZADO)                    │
├────────────────────────────────────────────────────────────────────────┤
│  ❌ Sem etapa de Viabilidade (apenas 4 etapas)                         │
│  ❌ Sem campo addressNumber (usa texto genérico no endereço)           │
│  ❌ Preços hardcoded: R$699, 6x R$199, 3x R$399                        │
│  ❌ 875 linhas de código inline (difícil manutenção)                   │
│  ❌ Carrega viabilityData do sessionStorage (fluxo externo)            │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  Registrar.tsx + RegistrarMarca.tsx (ATUALIZADOS)                      │
├────────────────────────────────────────────────────────────────────────┤
│  ✅ 5 etapas com Viabilidade integrada                                 │
│  ✅ Campo addressNumber separado                                       │
│  ✅ Usa hook usePricing() para preços dinâmicos                        │
│  ✅ Componentes modulares: ViabilityStep, PersonalDataStep, etc.       │
│  ✅ Fluxo completo e validado                                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Estratégia de Unificação

Substituir o formulário inline da Home (`RegistrationFormSection.tsx`) pelos mesmos componentes modulares usados no fluxo de checkout, mantendo o estilo visual da seção.

### Benefícios

1. **Manutenção única**: Alterações em um componente refletem em todos os fluxos
2. **Consistência**: Todos os usuários passam pelas mesmas validações
3. **Campo addressNumber**: Garantido em todos os formulários
4. **Etapa de Viabilidade**: Consulta INPI antes de prosseguir
5. **Preços dinâmicos**: Hook `usePricing()` sincronizado com admin

---

## Implementação

### Etapa 1: Refatorar RegistrationFormSection.tsx

Substituir o código inline pelos componentes modulares:

```tsx
// ANTES: 875 linhas de código inline
const RegistrationFormSection = () => {
  const [step, setStep] = useState(1);
  const [personalData, setPersonalData] = useState({...});
  // ... centenas de linhas de lógica e JSX duplicado
}

// DEPOIS: ~150 linhas usando componentes
const RegistrationFormSection = () => {
  const [step, setStep] = useState(1);
  
  // Estados e handlers simplificados
  const [viabilityData, setViabilityData] = useState(null);
  const [personalData, setPersonalData] = useState<PersonalData | null>(null);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentValue, setPaymentValue] = useState(0);

  return (
    <section id="registro" className="section-padding bg-card">
      {/* Header e Progress - mantém estilo atual */}
      <CheckoutProgress currentStep={step} />
      
      {/* Componentes modulares */}
      {step === 1 && <ViabilityStep onNext={handleViabilityNext} />}
      {step === 2 && <PersonalDataStep ... />}
      {step === 3 && <BrandDataStep ... />}
      {step === 4 && <PaymentStep ... />}
      {step === 5 && <ContractStep ... />}
    </section>
  );
};
```

### Etapa 2: Atualizar CheckoutProgress para 5 Etapas

O componente `CheckoutProgress` já suporta 5 etapas. A Home passará a usá-lo.

### Etapa 3: Manter Estilo Visual da Seção

Preservar o layout da seção Home:
- Background com gradientes
- Badge "Formulário de Registro"
- Título "Registre sua marca agora"
- Glass card com formulário

### Etapa 4: Ajustar Handlers para Consistência

```tsx
// Handlers padronizados (igual Registrar.tsx)
const handleViabilityNext = (brandName, businessArea, result) => {
  setViabilityData({ brandName, businessArea, result });
  setStep(2);
};

const handlePersonalDataNext = (data) => {
  setPersonalData(data);
  setStep(3);
};

// ... demais handlers
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/sections/RegistrationFormSection.tsx` | Refatorar para usar componentes modulares |

---

## Componentes Reutilizados (Sem Alteração)

Estes componentes já estão prontos e serão importados:

- `src/components/cliente/checkout/CheckoutProgress.tsx`
- `src/components/cliente/checkout/ViabilityStep.tsx`
- `src/components/cliente/checkout/PersonalDataStep.tsx`
- `src/components/cliente/checkout/BrandDataStep.tsx`
- `src/components/cliente/checkout/PaymentStep.tsx`
- `src/components/cliente/checkout/ContractStep.tsx`

---

## Resultado Final

```text
ANTES (3 implementações diferentes):
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Home Page      │  │  /registrar     │  │  /cliente/      │
│  (4 etapas)     │  │  (5 etapas)     │  │  registrar-marca│
│  Código inline  │  │  Componentes    │  │  (5 etapas)     │
│  Sem viability  │  │  Com viability  │  │  Componentes    │
│  Sem addressNum │  │  Com addressNum │  │  Com addressNum │
└─────────────────┘  └─────────────────┘  └─────────────────┘

DEPOIS (1 implementação compartilhada):
┌───────────────────────────────────────────────────────────┐
│            Componentes Modulares Compartilhados           │
│  ViabilityStep → PersonalDataStep → BrandDataStep →       │
│  PaymentStep → ContractStep                                │
└───────────────────────────────────────────────────────────┘
          ↑                 ↑                  ↑
   ┌──────────┐      ┌──────────┐       ┌──────────┐
   │ Home Page│      │/registrar│       │  Portal  │
   │  Seção   │      │  Landing │       │  Cliente │
   └──────────┘      └──────────┘       └──────────┘
```

---

## Estimativa

- **Complexidade**: Média
- **Arquivos alterados**: 1 (`RegistrationFormSection.tsx`)
- **Linhas removidas**: ~750 (código duplicado)
- **Linhas adicionadas**: ~150 (imports e composição)
- **Risco**: Baixo (componentes já testados nos outros fluxos)
