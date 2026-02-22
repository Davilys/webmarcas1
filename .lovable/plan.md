
# Plano: Corrigir Nomenclatura dos Paineis

## Entendimento

Existem 3 paineis no sistema:
1. **Painel do Cliente** -- portal do cliente (nao muda)
2. **Painel do ADM** -- painel do usuario administrador (atual "CRM WebMarcas" no header para admins comuns)
3. **Painel do CEO** -- painel do ADM Master (o branding/header do layout deve mostrar "Painel do CEO")

O erro anterior foi renomear o item de menu "Dashboard" para "Painel CEO". O correto e mudar o **branding do layout** (header e sidebar), nao o nome da pagina Dashboard.

---

## Alteracoes

### 1. Sidebar (`AdminLayout.tsx`)

- **Menu item Dashboard**: reverter de `'🧠 Painel CEO'` para `'Dashboard'` (linha 70)
- **Sidebar header label**: mudar `'CRM WebMarcas'` (linha 294) para `'Painel do CEO'`
- **Header branding "WebMarcas"** (linha 458): mudar para `'Painel CEO'`
- **Header subtitulo "CRM · v2026"** (linha 460-461): mudar para `'ADM Master · v2026'`

### 2. Mobile Bottom Nav (`MobileBottomNav.tsx`)

- **Label "CEO"** (linha 48): reverter para `'Dashboard'`

### 3. Dashboard page (`Dashboard.tsx`)

- Se houver titulo `"Painel CEO"` na pagina, reverter para `"Dashboard"` (manter a secao de Inteligencia Executiva como esta)

---

## O que NAO muda

- Nenhuma rota alterada
- Nenhuma tabela alterada
- Nenhuma permissao alterada
- Secao "Inteligencia Executiva" do dashboard permanece intacta
- Painel do cliente permanece identico

---

## Detalhes Tecnicos

Arquivos editados (somente texto/labels):
- `src/components/admin/AdminLayout.tsx` -- 4 alteracoes de texto
- `src/components/admin/MobileBottomNav.tsx` -- 1 alteracao de texto
- `src/pages/admin/Dashboard.tsx` -- verificar e reverter titulo se necessario

Impacto zero em logica, banco de dados ou funcionalidades existentes.
