

## Plano: Implementar Edição Completa de Contratos Não Assinados

### Resumo

Criar um diálogo de edição de contratos semelhante ao `CreateContractDialog`, permitindo que o administrador edite todos os dados (Dados Pessoais, Dados da Marca, Pagamento) de contratos **não assinados**. As alterações devem ser refletidas no contrato, no perfil do cliente, e quando o cliente acessar o link de assinatura, verá os dados atualizados.

---

### Problema Atual

Na linha 408 do arquivo `src/pages/admin/Contratos.tsx`, o botão "Editar" existe mas **não tem ação (onClick) definida**:
```tsx
<button className="hover:underline mr-2">Editar</button>
```

---

### Alterações Necessárias

| Arquivo | Ação |
|---------|------|
| `src/components/admin/contracts/EditContractDialog.tsx` | Criar - Novo componente de edição |
| `src/pages/admin/Contratos.tsx` | Modificar - Conectar botão "Editar" ao novo dialog |

---

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE EDIÇÃO                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Admin clica em "Editar" em contrato NÃO ASSINADO                        │
│                                                                              │
│  2. EditContractDialog abre pré-preenchido com:                             │
│     - Aba "Dados Pessoais": nome, email, telefone, CPF, endereço            │
│     - Aba "Dados da Marca": nome da marca, ramo de atividade, CNPJ          │
│     - Aba "Pagamento": método de pagamento selecionado                      │
│                                                                              │
│  3. Admin edita os campos desejados                                         │
│                                                                              │
│  4. Ao salvar:                                                              │
│     a) Atualiza tabela `profiles` (dados pessoais)                          │
│     b) Regenera `contract_html` com novos dados                             │
│     c) Atualiza `contracts` (valor, método, html)                           │
│     d) Cliente vê alterações no link de assinatura                          │
│                                                                              │
│  5. Se pagamento já criado no Asaas (asaas_payment_id != null):             │
│     -> Mostrar aviso que cobrança existente não será alterada               │
│     -> Admin deve cancelar manualmente no Asaas se necessário               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Detalhes do Componente EditContractDialog

**Props:**
```typescript
interface EditContractDialogProps {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}
```

**Estado interno:**
- `personalData`: dados pessoais (nome, email, telefone, CPF, endereço)
- `brandData`: dados da marca (nome, ramo, CNPJ)
- `paymentMethod`: método de pagamento ('avista' | 'cartao6x' | 'boleto3x')
- `loading`: estado de salvamento
- `currentTab`: aba ativa ('personal' | 'brand' | 'payment')

**Carregamento inicial (useEffect ao abrir):**
1. Buscar perfil do cliente (`profiles`) pelo `contract.user_id`
2. Extrair dados da marca do `contract.subject` ou `brand_processes`
3. Ler `contract.payment_method` para selecionar método

**Ação de Salvar:**
1. Atualizar `profiles` com dados pessoais editados
2. Regenerar `contract_html` usando `replaceContractVariables`
3. Atualizar `contracts` com:
   - `contract_value` (recalculado pelo método)
   - `payment_method`
   - `contract_html`
   - `subject` (se marca alterada)
4. Toast de sucesso + recarregar lista

---

### Restrições de Segurança

| Condição | Comportamento |
|----------|---------------|
| `signature_status = 'signed'` | Botão "Editar" desabilitado ou oculto |
| `asaas_payment_id != null` | Aviso: "Cobrança já gerada no gateway" |
| Contrato com link expirado | Pode editar normalmente |

---

### Visual das Abas (idêntico ao CreateContractDialog)

```text
┌──────────────────────────────────────────────────────────────────┐
│  Editar Contrato #20267601                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┬───────────────────┬──────────────────┐     │
│  │ Dados Pessoais  │  Dados da Marca   │    Pagamento     │     │
│  └─────────────────┴───────────────────┴──────────────────┘     │
│                                                                  │
│  Nome Completo *                                                 │
│  ┌────────────────────────────────────────────────────┐         │
│  │ João da Silva                                       │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  E-mail *                        Telefone *                      │
│  ┌──────────────────────┐        ┌──────────────────────┐       │
│  │ joao@email.com       │        │ (11) 99999-9999      │       │
│  └──────────────────────┘        └──────────────────────┘       │
│                                                                  │
│  ... (demais campos)                                             │
│                                                                  │
│                                    ┌──────────────────────────┐  │
│                                    │   Salvar Alterações     │  │
│                                    └──────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

### Modificações em Contratos.tsx

**Adicionar estado:**
```typescript
const [editContract, setEditContract] = useState<Contract | null>(null);
const [editOpen, setEditOpen] = useState(false);
```

**Modificar botão "Editar":**
```tsx
<button 
  className="hover:underline mr-2"
  onClick={() => {
    if (contract.signature_status === 'signed') {
      toast.error('Contratos assinados não podem ser editados');
      return;
    }
    setEditContract(contract);
    setEditOpen(true);
  }}
>
  Editar
</button>
```

**Adicionar dialog:**
```tsx
<EditContractDialog
  contract={editContract}
  open={editOpen}
  onOpenChange={setEditOpen}
  onSuccess={fetchContracts}
/>
```

---

### Regeneração do contract_html

Ao salvar edições, o sistema deve:
1. Buscar o template ativo (`contract_templates`)
2. Chamar `replaceContractVariables` com os novos dados
3. Salvar o HTML regenerado em `contracts.contract_html`

Isso garante que o cliente veja os dados atualizados ao acessar o link de assinatura.

---

### Considerações sobre Asaas

- Se o contrato já tem `asaas_payment_id`: a cobrança já foi criada
- Alterações no valor/método NÃO alteram cobrança existente automaticamente
- Admin deve cancelar manualmente no Asaas e regenerar o link
- O diálogo exibirá um aviso amarelo quando houver cobrança existente

---

### Seção Técnica

**Reutilização de código:**
- O `EditContractDialog` reutilizará grande parte da lógica do `CreateContractDialog`
- Funções compartilhadas: `replaceContractVariables`, validadores, formatters
- Componentes UI: mesma estrutura de tabs e campos

**Tabelas afetadas:**
- `profiles`: dados pessoais do cliente
- `contracts`: valor, método, html, subject

**Sem alteração em Edge Functions:**
- A Edge Function `create-post-signature-payment` já lê os dados do banco
- Ao atualizar o banco, a próxima execução usará os novos valores

**Ordem de implementação:**
1. Criar componente `EditContractDialog.tsx`
2. Importar e conectar em `Contratos.tsx`
3. Implementar lógica de carregamento e salvamento
4. Adicionar validações e avisos

