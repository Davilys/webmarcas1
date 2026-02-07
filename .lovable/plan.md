

## Plano: Adicionar Botão "Expirar Promoções" na Tela de Contratos

### Resumo

Adicionar um botão na página `/admin/contratos` que permite executar manualmente a função `expire-promotion-price` para atualizar contratos promocionais não assinados de R$ 699 para R$ 1.194.

---

### Alterações

| Arquivo | Ação |
|---------|------|
| `src/pages/admin/Contratos.tsx` | Modificar - Adicionar botão e lógica |

---

### Detalhes da Implementação

**1. Adicionar Estado para Controlar Loading**
```typescript
const [expiringPromotion, setExpiringPromotion] = useState(false);
```

**2. Criar Função `handleExpirePromotions`**
- Chamar a Edge Function `expire-promotion-price`
- Mostrar confirmação antes de executar
- Exibir toast com resultado (quantos contratos atualizados)
- Recarregar lista de contratos após sucesso

**3. Adicionar Botão no Header**
- Localização: Entre o botão de Refresh e "Novo Contrato"
- Estilo: Variante `outline` com ícone de relógio/timer
- Texto: "Expirar Promoções"
- Estado de loading durante execução

---

### Visual do Botão

```text
┌─────────────────────────────────────────────────────────────────┐
│  [🔄]  [⏱ Expirar Promoções]  [+ Novo Contrato]                │
│                                                                  │
│  Contratos                                                       │
│  Gerencie contratos e assinaturas                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Fluxo de Execução

1. Usuário clica em "Expirar Promoções"
2. Modal de confirmação aparece: "Deseja atualizar contratos promocionais não assinados de R$ 699 para R$ 1.194?"
3. Ao confirmar, chama a Edge Function
4. Toast mostra resultado: "X contratos atualizados com sucesso"
5. Lista de contratos é recarregada automaticamente

---

### Código do Botão

```typescript
<Button 
  variant="outline" 
  onClick={handleExpirePromotions}
  disabled={expiringPromotion}
  className="text-amber-600 border-amber-600 hover:bg-amber-50"
>
  {expiringPromotion ? (
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    <Timer className="h-4 w-4 mr-2" />
  )}
  Expirar Promoções
</Button>
```

---

### Função de Execução

```typescript
const handleExpirePromotions = async () => {
  if (!confirm(
    'Deseja atualizar contratos promocionais não assinados?\n\n' +
    '• Valor atual: R$ 699,00\n' +
    '• Novo valor: R$ 1.194,00\n\n' +
    'Apenas contratos à vista, não assinados e não pagos serão afetados.'
  )) return;
  
  setExpiringPromotion(true);
  try {
    const response = await supabase.functions.invoke('expire-promotion-price', {
      body: { triggered_by: 'manual_admin' }
    });
    
    if (response.error) throw response.error;
    
    const { updated_count } = response.data;
    
    if (updated_count > 0) {
      toast.success(`${updated_count} contrato(s) atualizado(s) com sucesso`);
    } else {
      toast.info('Nenhum contrato elegível para atualização');
    }
    
    fetchContracts(); // Recarrega a lista
  } catch (error) {
    console.error('Error expiring promotions:', error);
    toast.error('Erro ao expirar promoções');
  } finally {
    setExpiringPromotion(false);
  }
};
```

---

### Segurança

- Confirmação obrigatória antes de executar
- Feedback claro do resultado
- Não afeta contratos já assinados ou pagos
- Registro de log na tabela `promotion_expiration_logs`

