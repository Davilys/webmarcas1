

# Correcao do Dropdown + Lista de Processos do Cliente

## Problemas identificados

### 1. Dropdown de busca fica atras/cortado
O dropdown de resultados da busca de clientes (linha 1658) esta dentro de um `Card > CardHeader` que possui `overflow: hidden` implicito pelo `rounded` e pela `ScrollArea` logo abaixo. O `z-50` nao resolve porque o contexto de empilhamento (stacking context) e limitado pelo container pai. O dropdown e renderizado "inline" dentro do CardHeader, e o Card corta o conteudo que ultrapassa seus limites.

**Solucao**: Usar um **Popover do Radix** para o dropdown de resultados, que renderiza via portal (fora do DOM do Card), garantindo que fique sempre visivel por cima de qualquer elemento. Alternativamente, usar `position: fixed` calculando a posicao do input para posicionar o dropdown no viewport.

### 2. Lista de processos do mesmo cliente
Quando o processo e vinculado a um cliente que ja possui outros processos, exibir uma lista navegavel.

---

## Alteracoes no arquivo `src/components/admin/PublicacaoTab.tsx`

### Correcao 1: Dropdown visivel com Popover

Substituir o dropdown `absolute z-50` (linhas 1657-1679) por um componente `Popover` do Radix (ja importado no projeto). O `Popover` renderiza o conteudo em um portal, fora da hierarquia DOM do Card, eliminando qualquer problema de overflow/z-index.

```text
Estrutura:
<Popover open={showClientAssignDropdown} onOpenChange={setShowClientAssignDropdown}>
  <PopoverTrigger asChild>
    <Input ... />  (campo de busca)
  </PopoverTrigger>
  <PopoverContent className="w-80 p-0 max-h-52 overflow-y-auto" align="start">
    ... lista de clientes filtrados ...
  </PopoverContent>
</Popover>
```

Isso garante que os resultados da busca aparecem SEMPRE por cima, independente de Cards, ScrollAreas ou qualquer container.

### Correcao 2: Lista de processos do cliente vinculado

Apos o card verde do cliente vinculado (linhas 1629-1641), adicionar uma secao "Processos deste Cliente":

- Filtra `publicacoes` por `client_id === selected.client_id` (exclui o processo atual)
- Exibe lista compacta com: nome da marca, numero do processo, badge de status
- Ao clicar no numero/nome, chama `setSelectedId(pub.id)` para navegar ao processo
- Max-height com scroll para listas longas
- Contador de processos no titulo

```text
Estrutura visual:
[icone] Processos deste Cliente (3)
  - [badge DEFERIDA] Nome Marca · 123456789  [clicavel]
  - [badge PROTOCOLADO] Outra Marca · 987654  [clicavel]
  - [badge CERTIFICADA] Terceira · 555111222  [clicavel]
```

### Nenhuma alteracao de banco de dados
Todos os dados necessarios ja estao disponiveis no estado do componente (arrays `publicacoes`, `processMap`, `clientMap`).

