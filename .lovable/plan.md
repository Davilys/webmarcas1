

# Unificar Informacoes de Publicacoes no Ficheiro do Cliente

## Objetivo
Integrar automaticamente os dados de publicacoes (status do processo, timeline, prazos criticos) diretamente nas abas principais do ficheiro do cliente, sem precisar clicar em "Ciclo Completo" ou sair para o modulo de publicacoes.

## Arquivo a modificar
`src/components/admin/clients/ClientDetailSheet.tsx`

## Alteracoes

### 1. Carregar publicacoes automaticamente ao abrir o ficheiro
Atualmente os dados de publicacoes so sao carregados quando o usuario clica no botao "Ciclo Completo" (acao `processo`, linha ~700). A mudanca e carregar `publicacoes_marcas` junto com os outros dados na funcao `fetchClientData()` (linha ~300-400), para que estejam disponiveis nas abas desde o inicio.

- Adicionar query `publicacoes_marcas` filtrada por `client_id` (ou `process_id` para orfaos) dentro de `fetchClientData()`
- Salvar resultado em `processPublicacoes` (estado ja existente)

### 2. Adicionar card de Publicacoes na aba "Geral" (overview)
Inserir um novo card apos o card de "Notas Internas" (linha ~1625) na aba overview que mostra:

- Numero de publicacoes vinculadas ao cliente
- Para cada publicacao:
  - Nome da marca + numero do processo
  - Badge de status (Depositada, Publicada, Deferida, etc.) usando STATUS_CONFIG existente
  - Prazo critico com indicador de urgencia (dias restantes ou atrasado)
  - Mini-timeline com icones (6 etapas: Deposito, Publicacao RPI, Oposicao, Decisao, Certificado, Renovacao)
- Botao "Ver Ciclo Completo" que aciona `handleQuickAction('processo')`

### 3. Mostrar status da publicacao no header do ficheiro
No header do ficheiro (linha ~1050-1100), abaixo do nome do cliente e da marca, adicionar:
- Badge do status da publicacao mais recente (ex: "Deferida", "Publicada")
- Prazo critico proximo com cor de urgencia

### 4. Exibir detalhes da publicacao na aba "Marcas"
Na aba "Marcas" (valor `brands`), para cada marca listada, cruzar com `processPublicacoes` via `process_id` e mostrar:
- Status atual da publicacao vinculada
- Proximo prazo critico
- Descricao do prazo

## Detalhes tecnicos

**Dados reutilizados (sem novas queries):**
- `processPublicacoes` (estado ja existente, apenas carregado mais cedo)
- `clientBrands` (ja carregado no fetchClientData)
- `STATUS_CONFIG` inline (ja definido no componente)

**Componentes reutilizados:**
- Timeline inline (TIMELINE_STEPS_INLINE, ja implementado nas linhas 1237-1328)
- Badge de urgencia (logica getDaysLeft, ja implementada)
- STATUS_CONFIG_INLINE (ja definido nas linhas 1245-1254)

**Sem dependencias novas:**
- Nenhuma tabela nova
- Nenhuma query adicional alem da que ja existe para publicacoes
- Nenhum componente externo novo

## Impacto
- O ficheiro do cliente passa a mostrar o status do processo e publicacoes sem necessidade de navegar para outra tela
- O "Ciclo Completo" continua existindo para quem quiser ver a timeline detalhada com contratos e faturas
- Nenhuma funcionalidade existente e removida ou alterada

