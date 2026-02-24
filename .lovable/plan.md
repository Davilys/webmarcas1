

## Correcao: Logo WebMarcas quebrada no contrato

### Diagnostico

O componente `ContractRenderer.tsx` importa o logo de `@/assets/webmarcas-logo-new.png` e exibe com uma tag `<img>`. O arquivo existe no projeto, porem pode estar corrompido ou com problemas de carregamento.

Alem disso, a funcao `generateContractPrintHTML` (usada ao imprimir/baixar) usa um logo SVG placeholder generico (retangulo azul com texto branco) em vez do logo real.

### Solucao

1. **Adicionar fallback no `ContractRenderer`**: Colocar `onError` no `<img>` para trocar para o logo `webmarcas-logo-mark.png` (que sabemos que funciona, pois aparece no header do site) caso o `webmarcas-logo-new.png` falhe

2. **Trocar o import principal**: Usar `webmarcas-logo-mark.png` como logo principal no contrato, ja que este e o logo que funciona em toda a aplicacao (header, etc)

3. **Atualizar `generateContractPrintHTML`**: Fazer a funcao aceitar o logo real convertido em base64 em vez de usar o fallback SVG generico

### Arquivo a editar

| Arquivo | Alteracao |
|---------|-----------|
| `ContractRenderer.tsx` | Trocar import de `webmarcas-logo-new.png` para `webmarcas-logo-mark.png`, adicionar `onError` fallback no `<img>`, e atualizar `generateContractPrintHTML` para usar logo real via base64 |

### Detalhes tecnicos

```text
Antes:
  import webmarcasLogo from '@/assets/webmarcas-logo-new.png'

Depois:
  import webmarcasLogo from '@/assets/webmarcas-logo-mark.png'

No <img>:
  onError={(e) => { e.currentTarget.src = WEBMARCAS_LOGO_FALLBACK; }}

Na funcao generateContractPrintHTML:
  - Adicionar parametro opcional logoBase64
  - Usar logoBase64 se disponivel, senao WEBMARCAS_LOGO_FALLBACK
```

Tambem aplicar a mesma correcao no `DocumentRenderer.tsx` que importa o mesmo logo.

