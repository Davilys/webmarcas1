
## Remover "Cliente / Processo" do Email no Ficheiro

### Problema
Quando o EmailCompose abre dentro do ficheiro do cliente, ele mostra o campo "Cliente / Processo" com busca de clientes. Isso nao faz sentido porque o cliente ja esta selecionado no ficheiro. O tipo de publicacao/fase deve permanecer pois se aplica ao processo do cliente.

### Solucao
Adicionar uma prop `hideClientSearch` ao componente `EmailCompose`. Quando `true`, o modo processual mostra apenas o dropdown de "Tipo de Publicacao / Fase" (sem o campo de busca de cliente), e o cliente e automaticamente preenchido com os dados vindos do ficheiro.

### Alteracoes

#### 1. `src/components/admin/email/EmailCompose.tsx`

**Adicionar props novas a interface:**

```text
interface EmailComposeProps {
  // ... props existentes
  hideClientSearch?: boolean;       // Esconder busca de cliente (usado no ficheiro)
  initialClientData?: {             // Dados do cliente pre-selecionado
    id: string;
    full_name: string;
    email: string;
    brand_name?: string;
    process_number?: string;
  };
}
```

**No modo processual (linhas 469-541):**
- Quando `hideClientSearch` e `true`, renderizar apenas a coluna "Tipo de Publicacao / Fase" em largura completa
- O campo "Cliente / Processo" nao aparece
- O `selectedClient` e inicializado automaticamente com `initialClientData`

**No useEffect inicial:**
- Se `initialClientData` existir, fazer `setSelectedClient(initialClientData)` automaticamente

#### 2. `src/components/admin/clients/ClientDetailSheet.tsx`

**Passar as novas props ao EmailCompose (linhas 699-705):**

```text
<EmailCompose
  onClose={() => setShowEmailCompose(false)}
  initialTo={client.email}
  initialName={client.full_name || ''}
  accountId={adminEmailAccount?.id || null}
  accountEmail={adminEmailAccount?.email_address}
  hideClientSearch={true}
  initialClientData={{
    id: client.id,
    full_name: client.full_name || '',
    email: client.email || '',
    brand_name: client.brand_name,
    process_number: client.process_number,
  }}
/>
```

### Resultado

- No ficheiro: modo processual mostra apenas "Tipo de Publicacao / Fase" (o cliente ja e o do ficheiro)
- Na pagina de Emails normal: tudo continua igual (campo de busca de cliente + tipo de publicacao)
- Templates processuais continuam funcionando com as variaveis do cliente preenchidas automaticamente

### Arquivos a editar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/admin/email/EmailCompose.tsx` | Adicionar props `hideClientSearch` e `initialClientData`, condicionar renderizacao |
| `src/components/admin/clients/ClientDetailSheet.tsx` | Passar as novas props ao EmailCompose |
