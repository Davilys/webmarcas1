

## O Que Falta Para o Modulo "Publicacao" Ficar 100% Funcional e Premium

### Estado Atual (O Que Ja Funciona)

- Layout 3 paineis (sidebar filtros, lista, timeline)
- CRUD basico (criar/editar publicacao)
- Timeline visual com 6 etapas
- Calculo automatico de prazos (oposicao +60d, renovacao +10 anos)
- Filtros por cliente, status, prazo critico, tipo
- Exportacao CSV
- Badges de urgencia com cores (verde/amarelo/vermelho/pulsante)
- Logs de auditoria (quem alterou, quando, o que)
- Toast de alerta ao abrir com prazos criticos

### O Que Falta (14 Melhorias)

#### 1. Dashboard KPI no Topo

Adicionar 4 cards de metricas animados acima dos 3 paineis:
- Total de Processos
- Prazos Urgentes (< 7 dias)
- Atrasados
- Deferidos este mes

Usa o mesmo componente `StatCard` com gradientes que ja existe na `RevistaINPI.tsx`.

#### 2. Gerar Lembrete Real (Inserir na Tabela `notifications`)

Atualmente o botao "Gerar Lembrete" so mostra um toast. Precisa realmente inserir uma notificacao na tabela `notifications` para o cliente e o admin, com titulo, mensagem e link.

#### 3. Upload de Documento RPI

O campo `documento_rpi_url` existe na tabela mas nao ha interface para upload. Adicionar botao de upload no painel de detalhes que salva no bucket `documents` e atualiza o campo.

#### 4. Exibir Link RPI Oficial

O campo `rpi_link` existe mas nao e exibido no painel de detalhes. Adicionar botao com icone `ExternalLink` que abre o link da RPI oficial em nova aba.

#### 5. Atribuicao de Responsavel (Admin)

No dialog de criacao e edicao, adicionar dropdown para selecionar o admin responsavel. Na lista de processos, exibir o nome do responsavel.

#### 6. Campos Extras no Dialog de Criacao

O dialog de criacao atual so permite selecionar o processo. Falta:
- Data de deposito (pre-preenchida do processo)
- Data publicacao RPI (opcional)
- Tipo de publicacao
- Admin responsavel

#### 7. Opcao de Excluir Publicacao

Adicionar botao de exclusao no painel de detalhes com confirmacao (dialog de alerta).

#### 8. Auto-Popular a Partir dos Dados da RPI

Quando um `rpi_entry` e processado e vinculado a um processo (`matched_process_id`), oferecer um botao ou fluxo para criar automaticamente o registro de publicacao com os dados ja preenchidos (data publicacao, numero RPI, tipo de despacho).

#### 9. Notificacoes Agendadas (30d / 15d / 7d)

Exibir no painel de detalhes uma secao "Alertas Programados" mostrando as datas de alerta futuras calculadas (30, 15 e 7 dias antes do proximo prazo critico). O botao "Gerar Lembrete" agenda estas notificacoes.

#### 10. Coluna "Responsavel" na Tabela da Lista

Adicionar coluna com o nome do admin responsavel na tabela de processos (visivel em telas maiores).

#### 11. Corrigir Warning do Console

Warning atual: "Function components cannot be given refs" no componente `Badge` dentro da `RevistaINPI`. Ajustar o uso para eliminar o warning.

#### 12. Indicador de RPI Number e Documento no Painel

No painel de detalhes, exibir o numero da RPI e se ha documento anexado (com link para download).

#### 13. Contador de Processos por Status na Sidebar

Na sidebar de filtros, exibir ao lado de cada opcao de status a quantidade de processos naquele status (ex: "Depositada (5)").

#### 14. Tipo de Publicacao no Dialog de Edicao

O campo `tipo_publicacao` existe no banco mas nao aparece no dialog de edicao. Adicionar select para alterar entre publicacao_rpi, decisao, certificado e renovacao.

### Detalhes Tecnicos

#### Arquivos a Editar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/admin/PublicacaoTab.tsx` | Todas as 14 melhorias acima |

#### Nenhum Arquivo Novo Necessario

Tudo se resolve editando apenas o `PublicacaoTab.tsx` existente.

#### Nenhuma Alteracao de Banco de Dados

Todos os campos ja existem nas tabelas `publicacoes_marcas` e `publicacao_logs`. A unica interacao nova e a insercao na tabela `notifications` (ja existente) para o lembrete real.

### Resumo de Impacto

- Zero alteracoes em tabelas existentes
- Zero novas rotas ou APIs
- Zero impacto em outras abas
- Apenas melhorias no componente `PublicacaoTab.tsx` existente
- Resultado: modulo completo, premium e 100% funcional

