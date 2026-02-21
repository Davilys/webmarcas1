

# Criar Templates Pre-Populados para SMS e WhatsApp

## O que sera feito

Inserir templates prontos na tabela `channel_notification_templates` para os canais SMS e WhatsApp, equivalentes aos templates que ja existem nos E-mails Automaticos (Formulario Abandonado 24h, Formulario Concluido, Contrato Assinado, Link de Assinatura, Pagamento Confirmado, Credenciais de Acesso).

## Templates a criar (12 total: 6 SMS + 6 WhatsApp)

### Para cada canal (SMS e WhatsApp):

| Template | Gatilho | Mensagem |
|----------|---------|----------|
| Formulario Abandonado 24h | form_abandoned (sera adicionado ao triggerConfig) | {{nome}}, nao deixe sua marca desprotegida! Complete seu registro em webmarcas.net |
| Formulario Concluido | formulario_preenchido | Ola {{nome}}! Recebemos sua solicitacao de registro da marca {{marca}}. Em breve entraremos em contato! |
| Contrato Assinado | contrato_assinado | {{nome}}, seu contrato da marca {{marca}} foi assinado com sucesso! Processo: {{numero_processo}} |
| Link de Assinatura | link_assinatura_gerado | {{nome}}, seu documento esta pronto para assinatura! Acesse: {{link_assinatura}} - Valido ate {{data_expiracao}} |
| Pagamento Confirmado | pagamento_confirmado | {{nome}}, seu pagamento foi confirmado! Obrigado pela confianca. Marca: {{marca}} |
| Credenciais de Acesso | user_created (sera adicionado ao triggerConfig) | {{nome}}, suas credenciais de acesso foram criadas! Acesse webmarcas.net para acompanhar seu processo. |

### Mensagens WhatsApp (mais detalhadas, com emojis)
As mensagens do WhatsApp serao levemente mais longas e com emojis, seguindo o padrao de comunicacao do canal.

### Mensagens SMS (mais curtas, sem emojis)
As mensagens SMS serao mais concisas respeitando o limite de caracteres do SMS.

## Detalhes Tecnicos

### Migracao SQL
- INSERT de 12 registros na tabela `channel_notification_templates` (6 para `sms`, 6 para `whatsapp`)
- Todos com `is_active = true`

### Atualizacao do triggerConfig
- Adicionar `form_abandoned` e `user_created` ao mapeamento de gatilhos no `ChannelNotificationTemplates.tsx` para que os novos templates aparecam com icone e cor corretos

### Arquivos modificados
| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar (seed dos 12 templates) |
| `src/components/admin/settings/ChannelNotificationTemplates.tsx` | Modificar (adicionar gatilhos form_abandoned e user_created ao triggerConfig) |

### Nenhum novo componente necessario
A infraestrutura de templates (CRUD, ativacao/desativacao, edicao) ja existe e funciona.

