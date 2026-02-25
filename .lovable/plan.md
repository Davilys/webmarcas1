

## Modulo "Publicacao" - Gestao Premium de Prazos e Publicacoes de Marcas INPI

### Visao Geral

Criar uma aba "Publicacao" isolada e premium no CRM, dedicada exclusivamente a gestao de prazos legais e publicacoes oficiais do INPI para registro de marcas. O modulo opera em 3 paineis (sidebar de filtros, lista de processos, detalhes/timeline), com calculos automaticos de prazos, alertas por urgencia e logs de auditoria.

### Principios de Seguranca

- Nenhuma tabela existente sera alterada
- Nenhuma rota, API ou fluxo existente sera modificado
- Apenas 4 arquivos existentes recebem adicoes minimas (nova rota, novo menu item, nova permissao)
- Duas novas tabelas isoladas com RLS restrito a admins
- Zero impacto em contratos, pagamentos, leads, pipeline ou qualquer outra funcionalidade

### Arquitetura do Modulo

```text
+---------------------+---------------------------+-------------------------------+
|  SIDEBAR FILTROS    |   LISTA DE PROCESSOS      |  DETALHES / TIMELINE          |
|                     |                           |                               |
| Cliente [dropdown]  | Cliente | Marca | N.Proc  | Timeline Visual:              |
| Status  [select]    | Deposito | Pub.RPI | Prazo |  Deposito                    |
| Prazo   [select]    | Status(badge) | Resp.     |  Publicacao RPI              |
| Tipo    [select]    | Acoes                     |  Prazo Oposicao (60d)        |
|                     |                           |  Decisao                     |
| [Limpar Filtros]    |                           |  Certificado                 |
| [Exportar CSV]      |                           |  Renovacao (10 anos)         |
|                     |                           |                               |
|                     |                           | Historico de Alteracoes       |
|                     |                           | Campos Editaveis              |
|                     |                           | Upload Doc RPI                |
|                     |                           | Botoes de Acao                |
+---------------------+---------------------------+-------------------------------+
```

### Detalhes Tecnicos

#### 1. Novas Tabelas (Migracao SQL)

**Tabela `publicacoes_marcas`** - Armazena dados de publicacoes e prazos por processo:

- `id` uuid PK
- `process_id` uuid FK -> brand_processes(id) UNIQUE
- `client_id` uuid (referencia somente leitura)
- `admin_id` uuid (responsavel)
- `status` text (depositada, publicada, oposicao, deferida, indeferida, arquivada, renovacao_pendente)
- `tipo_publicacao` text (publicacao_rpi, decisao, certificado, renovacao)
- `data_deposito` date
- `data_publicacao_rpi` date
- `prazo_oposicao` date (calculado: publicacao + 60 dias)
- `data_decisao` date
- `data_certificado` date
- `data_renovacao` date (calculado: certificado + 10 anos)
- `proximo_prazo_critico` date
- `descricao_prazo` text
- `oposicao_protocolada` boolean
- `oposicao_data` date
- `comentarios_internos` text
- `documento_rpi_url` text
- `rpi_number` text
- `rpi_link` text (link direto para RPI oficial)
- `created_at` / `updated_at` timestamptz

RLS: Somente admins (usando `has_role(auth.uid(), 'admin')`)

**Tabela `publicacao_logs`** - Historico de auditoria:

- `id` uuid PK
- `publicacao_id` uuid FK -> publicacoes_marcas(id)
- `admin_id` uuid
- `admin_email` text
- `campo_alterado` text
- `valor_anterior` text
- `valor_novo` text
- `created_at` timestamptz

RLS: Somente admins

#### 2. Nova Pagina: `src/pages/admin/Publicacao.tsx`

Componente principal com 3 paineis responsivos:

**Sidebar de Filtros:**
- Dropdown de clientes (da tabela `profiles`, somente leitura)
- Select de status (depositada, publicada, oposicao, deferida, indeferida, arquivada, renovacao_pendente)
- Filtro de prazo critico (vence hoje, proximos 7 dias, proximos 30 dias, atrasados)
- Tipo de publicacao (publicacao_rpi, decisao, certificado, renovacao)
- Botao "Limpar Filtros"
- Botao "Exportar CSV"

**Lista de Processos (tabela dinamica):**
- Colunas: Cliente, Marca, N. Processo INPI, Data Deposito, Data Publicacao RPI, Prazo Atual (com contagem regressiva de dias), Status (badge colorido), Responsavel, Acoes
- Badges de urgencia: verde (>30 dias), amarelo (7-30 dias), vermelho (<7 dias), preto/pulsante (atrasado)
- Botoes de acao: Ver detalhes, Editar prazo, Gerar lembrete
- Busca por texto (marca, processo, cliente)

**Detalhes/Timeline (ao selecionar processo):**
- Timeline visual vertical com 6 etapas: Deposito -> Publicacao RPI -> Prazo Oposicao (60d) -> Decisao -> Certificado -> Renovacao (10 anos)
- Cada etapa mostra data, status (concluida/pendente/atrasada), e indicador visual
- Historico de alteracoes (quem, quando, o que mudou) via tabela `publicacao_logs`
- Campos editaveis: Data publicacao RPI, Prazo oposicao (auto-calculado), Data decisao, Data certificado, Comentarios internos
- Botoes: "Gerar Lembrete" (insere em `notifications`), "Marcar Oposicao Protocolada", "Upload Documento RPI"

**Calculos automaticos:**
- Ao preencher `data_publicacao_rpi`: calcula `prazo_oposicao = data + 60 dias`
- Ao preencher `data_certificado`: calcula `data_renovacao = data + 10 anos`
- `proximo_prazo_critico` = menor data futura pendente

**Alertas:**
- Toast notifications ao abrir a aba para prazos criticos (vence em <7 dias)
- Botao "Gerar Lembrete" insere notificacao na tabela `notifications` para cliente e admin
- Indicadores visuais de urgencia na lista

**Criacao manual:**
- Dialog para criar novo registro de publicacao vinculando a um processo (`brand_processes`) existente
- Pre-carrega dados do processo selecionado (marca, numero, NCL, cliente)

**Exportacao:**
- CSV com filtros aplicados (cliente, status, periodo)

#### 3. Edicoes em Arquivos Existentes (Adicoes minimas)

**`src/App.tsx`** - Adicionar 1 import e 1 rota:
```text
import AdminPublicacao from "./pages/admin/Publicacao";
<Route path="/admin/publicacao" element={<AdminPublicacao />} />
```

**`src/components/admin/AdminLayout.tsx`** - Adicionar 1 item ao array `menuItems`:
```text
{
  icon: Newspaper,
  label: 'Publicacao',
  subtitle: 'Prazos e publicacoes',
  href: '/admin/publicacao',
  iconColor: 'text-rose-500',
  iconBg: 'bg-rose-100 dark:bg-rose-900/30',
  permissionKey: 'publications'
}
```

**`src/components/admin/MobileBottomNav.tsx`** - Adicionar 1 item ao array `moreItems`:
```text
{ icon: Newspaper, label: 'Publicacao', href: '/admin/publicacao', color: 'text-rose-500', permissionKey: 'publications' }
```

**`src/hooks/useAdminPermissions.ts`** - Adicionar ao array `CRM_SECTIONS` e `PATH_TO_PERMISSION_KEY`:
```text
{ key: 'publications', label: 'Publicacao', description: 'Prazos e publicacoes de marcas' }
'/admin/publicacao': 'publications'
```

#### 4. Design Visual

- Segue o mesmo padrao visual do CRM existente (cards com gradientes, badges coloridos, motion animations)
- Timeline vertical com icones Lucide e indicadores de progresso
- Responsivo: em mobile os 3 paineis empilham verticalmente
- Dark mode compativel via classes Tailwind existentes
- Icone: `Newspaper` do Lucide (ja importado em RevistaINPI)

### Resumo de Arquivos

| Arquivo | Acao | Impacto |
|---------|------|---------|
| Migracao SQL | Criar | 2 tabelas novas isoladas com RLS |
| `src/pages/admin/Publicacao.tsx` | Criar | Pagina completa ~800 linhas |
| `src/App.tsx` | Editar | +2 linhas (import + rota) |
| `src/components/admin/AdminLayout.tsx` | Editar | +8 linhas (menu item) |
| `src/components/admin/MobileBottomNav.tsx` | Editar | +1 linha (more item) |
| `src/hooks/useAdminPermissions.ts` | Editar | +2 linhas (permissao + path) |

### Seguranca e Isolamento

- Nenhuma tabela existente e alterada
- Dados de `profiles` e `brand_processes` sao lidos em modo somente leitura via SELECT
- Novas tabelas com RLS: `has_role(auth.uid(), 'admin')`
- Logs de auditoria para todas as alteracoes
- Permissoes granulares via `admin_permissions` existente
- Sem dependencias obrigatorias - fallback seguro se tabelas estiverem vazias

