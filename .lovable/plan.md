

## Adicionar Evento Purchase na Página /obrigado

### Problema Identificado

A página `/obrigado` (fluxo público de registro de marca) **não rastreia** o evento `Purchase` do Meta Pixel, enquanto a página `/cliente/pedido-confirmado` (área logada) já possui esse rastreamento.

### Arquivos Atuais

| Arquivo | Status Purchase |
|---------|-----------------|
| `src/pages/cliente/PedidoConfirmado.tsx` | ✅ Implementado |
| `src/pages/Obrigado.tsx` | ❌ **FALTANDO** |

---

### Solução Proposta

#### Arquivo: `src/pages/Obrigado.tsx`

**1. Importar a função de tracking:**
```typescript
import { trackPurchase } from "@/lib/metaPixel";
import { useRef } from "react";
```

**2. Adicionar ref para evitar disparo duplicado:**
```typescript
const purchaseTracked = useRef(false);
```

**3. Disparar evento Purchase quando dados são carregados:**
```typescript
useEffect(() => {
  const data = sessionStorage.getItem("registrationComplete");
  if (data) {
    try {
      const parsedData = JSON.parse(data);
      setRegistrationData(parsedData);
      
      // Track Purchase event (apenas uma vez)
      if (!purchaseTracked.current) {
        trackPurchase(parsedData.paymentValue || 698.97, 'BRL');
        purchaseTracked.current = true;
      }
    } catch {
      navigate("/registro");
    }
  } else {
    navigate("/registro");
  }
  
  setTimeout(() => setShowConfetti(false), 3000);
}, [navigate]);
```

---

### Fluxo de Eventos Completo

```text
┌─────────────────────────────────────────────────────────┐
│                    FLUXO META PIXEL                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Visitante acessa site → PageView ✅                     │
│           ↓                                              │
│  Preenche dados pessoais → Lead ✅                       │
│           ↓                                              │
│  Entra na tela de pagamento → InitiateCheckout ✅        │
│           ↓                                              │
│  Finaliza pedido → Vai para /obrigado                    │
│           ↓                                              │
│  Página /obrigado carrega → Purchase ✅ (SERÁ ADICIONADO)│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### Detalhes Técnicos

| Aspecto | Implementação |
|---------|---------------|
| Valor rastreado | `paymentValue` dos dados ou `R$ 698,97` (padrão) |
| Moeda | `BRL` |
| Prevenção de duplicatas | `useRef` para garantir 1 disparo por sessão |
| Dependências | Nenhuma nova (usa `metaPixel.ts` existente) |
| Impacto na performance | Zero (apenas 1 linha de código) |

---

### O que NÃO será alterado

- ❌ Nenhuma tabela do banco de dados
- ❌ Nenhuma Edge Function
- ❌ Nenhuma lógica de pagamento
- ❌ Nenhuma integração existente
- ❌ Nenhum formulário

### Arquivos Modificados

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `src/pages/Obrigado.tsx` | Adicionar import + tracking no useEffect |

