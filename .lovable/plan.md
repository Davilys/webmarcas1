
# Adicionar "Tipo de Servico" ao Painel de Publicacoes

## Objetivo

Replicar os cards de **Tipo de Servico** que existem na aba "Servicos" do ficheiro do cliente (`ClientDetailSheet`) para dentro do painel de detalhes da publicacao (`PublicacaoDetailPanel`), permitindo que o admin altere o tipo de servico diretamente a partir do contexto da publicacao.

## O que sera feito

### Arquivo: `src/components/admin/publicacao/PublicacaoDetailPanel.tsx`

1. **Importar icones necessarios** - Adicionar `FileCheck`, `Shield`, `TrendingUp`, `RefreshCw`, `Star`, `CheckCircle`, `Package`, `Check` ao import de lucide-react.

2. **Definir a constante `SERVICE_TYPES`** - Mesma lista de 9 servicos que existe no `ClientDetailSheet`:
   - Pedido de Registro
   - Cumprimento de Exigencia
   - Manifestacao de Oposicao
   - Recurso Administrativo
   - Renovacao de Marca
   - Notificacao Extrajudicial
   - Deferimento
   - Certificado
   - Distrato

3. **Definir mapeamento `STATUS_TO_SERVICE`** - Para detectar automaticamente o servico atual com base no status da publicacao (ex: status `oposicao` -> servico `oposicao`, status `certificada` -> servico `certificado`).

4. **Adicionar estado `selectedServiceType`** - Estado local para controlar qual servico esta selecionado.

5. **Renderizar secao "Tipo de Servico"** - Inserir entre a Timeline e os Alertas Programados, com os mesmos cards interativos do ficheiro do cliente (icone, label, descricao, checkmark no selecionado).

6. **Ao clicar num servico** - Atualizar o status da publicacao via `onUpdateFields` para o status correspondente (mapeamento servico -> status de publicacao), com feedback visual imediato.

## Detalhes Tecnicos

- O mapeamento servico-para-status usara: `pedido_registro` -> `depositada`, `cumprimento_exigencia` -> `publicada`, `oposicao` -> `oposicao`, `recurso` -> `indeferida`, `renovacao` -> `renovacao_pendente`, `deferimento` -> `deferida`, `certificado` -> `certificada`, `distrato` -> `arquivada`.
- O servico selecionado sera detectado automaticamente pelo status atual da publicacao ao abrir o painel.
- O componente reutiliza a mesma estetica (motion.button, bordas, icones) do `ClientDetailSheet` para consistencia visual.
