
# Plano: Corrigir Exibição de "Aguardando assinatura..." em Contratos Assinados

## Problema Identificado

Na visualização de documentos, o lado do **Contratante** mostra "Aguardando assinatura..." mesmo quando o contrato já está **assinado digitalmente** (como mostrado na imagem do usuário).

### Causa Raiz

O `DocumentRenderer.tsx` (linhas 429-438) usa a seguinte lógica:

```tsx
{clientSignature ? (
  <img src={clientSignature} ... />
) : (
  <p className="text-gray-400 italic text-sm py-4">
    Aguardando assinatura...
  </p>
)}
```

O problema é que:
- Para **procurações**: requer rubrica manuscrita → `client_signature_image` é preenchido
- Para **contratos**: apenas aceite digital → `client_signature_image` fica `null`

Verificação no banco de dados confirmou que todos os contratos assinados têm:
- `signature_status: 'signed'` 
- `blockchain_hash` preenchido
- `client_signature_image: null`

## Solução Proposta

### Modificar a lógica de exibição da assinatura do cliente

No `DocumentRenderer.tsx`, a seção de assinatura do cliente (linhas 420-441) deve considerar:

1. Se tem `clientSignature` (imagem de rubrica) → mostrar imagem
2. **SENÃO**, se tem `blockchainSignature?.hash` → mostrar "✓ Assinado Digitalmente"
3. **SENÃO** → mostrar "Aguardando assinatura..."

### Código a ser alterado

**Arquivo**: `src/components/contracts/DocumentRenderer.tsx`

**De** (linhas 428-439):
```tsx
<div className="border-b-2 border-black mx-auto w-64 pb-2 min-h-[4rem]">
  {clientSignature ? (
    <img 
      src={clientSignature} 
      alt="Assinatura do Cliente"
      className="h-16 mx-auto object-contain"
    />
  ) : (
    <p className="text-gray-400 italic text-sm py-4">
      Aguardando assinatura...
    </p>
  )}
</div>
```

**Para**:
```tsx
<div className="border-b-2 border-black mx-auto w-64 pb-2 min-h-[4rem]">
  {clientSignature ? (
    <img 
      src={clientSignature} 
      alt="Assinatura do Cliente"
      className="h-16 mx-auto object-contain"
    />
  ) : blockchainSignature?.hash ? (
    <div className="flex items-center justify-center h-16">
      <span className="text-blue-600 font-medium text-sm">
        ✓ Assinado Digitalmente
      </span>
    </div>
  ) : (
    <p className="text-gray-400 italic text-sm py-4">
      Aguardando assinatura...
    </p>
  )}
</div>
```

### Também adicionar texto de certificação para contratos assinados

Abaixo da caixa de assinatura do cliente, adicionar referência à Lei 14.063/2020 quando assinado digitalmente (similar ao lado da empresa):

```tsx
<p className="text-xs text-gray-500 mt-2">
  {blockchainSignature?.hash 
    ? 'Certificação Digital - Lei 14.063/2020'
    : ''
  }
</p>
```

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Contrato assinado (sem rubrica) | "Aguardando assinatura..." | "✓ Assinado Digitalmente" |
| Procuração assinada (com rubrica) | Imagem da rubrica | Imagem da rubrica |
| Documento não assinado | "Aguardando assinatura..." | "Aguardando assinatura..." |

## Detalhamento Técnico

### Arquivo a modificar:
- `src/components/contracts/DocumentRenderer.tsx`

### Linhas afetadas:
- 428-441 (seção de assinatura do cliente)

### Impacto:
A correção afetará automaticamente todas as visualizações que usam o `DocumentRenderer`:
- ContractDetailSheet (Admin)
- DocumentPreview (Cliente)
- AssinarDocumento (Página de Assinatura)

### Validação:
1. Abrir contrato assinado no painel admin
2. Verificar que agora mostra "✓ Assinado Digitalmente" em ambos os lados
3. Verificar que procurações continuam mostrando a imagem da rubrica
4. Verificar que documentos pendentes continuam mostrando "Aguardando assinatura..."
