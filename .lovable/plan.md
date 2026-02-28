

# Painel de Acao por Etapa (Notificacao + Cobranca) na Aba Servicos

## Objetivo

Quando o usuario clicar em uma etapa na aba "Servicos" do ficheiro do cliente (ex: "003"), um painel expandivel aparece **abaixo** dos cards de etapa (na mesma pagina), contendo:

1. **Notificacao por Email e WhatsApp** com template pre-preenchido referenciando a fase da publicacao, prazo de 60 dias do INPI, e as clausulas 5.2 e 10.3 do contrato
2. **Upload de documento** para anexar a notificacao
3. **Selecao de cobranca** com valor (a vista ou parcelado, boleto/cartao), prazo de 10 dias
4. **Botao de envio** que dispara tudo automaticamente para o cliente

## Funcionamento

```text
[Etapa 1: PROTOCOLADO]
[Etapa 2: 003]  <-- selecionada (destaque)
[Etapa 3: Oposicao]
...

  +----------------------------------------------+
  | PAINEL DE ACAO - 003                         |
  |                                              |
  | [Template Email/WhatsApp pre-preenchido]     |
  | [Textarea editavel com mensagem]             |
  | [Checkbox: Email] [Checkbox: WhatsApp]       |
  |                                              |
  | [Upload de Documento]  arquivo.pdf           |
  |                                              |
  | --- Cobranca ---                             |
  | Valor: R$ [____]                             |
  | Metodo: (o) A vista  (o) Parcelado           |
  | Forma:  (o) Boleto   (o) Cartao              |
  | Parcelas: [select 2-12x]                     |
  | Vencimento: +10 dias (automatico)            |
  |                                              |
  | [====== ENVIAR NOTIFICACAO + COBRANCA ======] |
  +----------------------------------------------+
```

## O que sera criado/modificado

### 1. Novo componente: `src/components/admin/clients/ServiceActionPanel.tsx`

Componente isolado que recebe os dados do cliente e da etapa selecionada. Contem:

- **Mensagem pre-preenchida** com template referenciando:
  - Nome do cliente e marca
  - Fase da publicacao selecionada
  - Prazo de 60 dias do INPI
  - Clausula 5.2 (cumprimento de exigencia) e 10.3 (cobranca de 1 salario minimo)
- **Checkboxes** para selecionar canais (Email, WhatsApp)
- **Upload de documento** usando o bucket "documents" existente
- **Secao de cobranca** com:
  - Input de valor (default: 1 salario minimo vigente = R$ 1.518,00 em 2025)
  - RadioGroup: A vista / Parcelado
  - Se parcelado: Select de forma (boleto/cartao) e numero de parcelas
  - Data de vencimento auto-calculada (+10 dias)
- **Botao "Enviar"** que executa em sequencia:
  1. Upload do documento (se houver) para o storage
  2. Criacao da cobranca via `create-admin-invoice`
  3. Envio da notificacao via `send-multichannel-notification` (com link da fatura)
  4. Registro da atividade em `client_activities`

### 2. Modificar: `src/components/admin/clients/ClientDetailSheet.tsx`

- Adicionar state `expandedStageAction` (string | null) para controlar qual etapa tem o painel aberto
- Ao clicar em uma etapa, alem de atualizar o pipeline_stage, abrir/fechar o painel de acao abaixo
- Renderizar `<ServiceActionPanel>` condicionalmente abaixo da lista de etapas
- O painel aparece com animacao (framer-motion) e pode ser fechado com um X

## Detalhes Tecnicos

### Template de Email (pre-preenchido, editavel)

```text
Prezado(a) {nome},

Informamos que o INPI publicou uma exigencia referente ao processo
da marca "{marca}" (Protocolo: {numero_processo}).

Conforme o prazo legal, voce tem 60 (sessenta) dias corridos para
o cumprimento desta exigencia, contados a partir da data de publicacao
na Revista da Propriedade Industrial (RPI).

De acordo com a Clausula 5.2 do seu contrato, o cumprimento de
exigencias formais constitui servico adicional. Conforme a Clausula
10.3, sera cobrado o valor correspondente a 1 (um) salario minimo
vigente no ano da publicacao.

Para dar continuidade ao processo, solicitamos o pagamento da taxa
de servico no valor de R$ {valor}.

{link_pagamento}

Estamos a disposicao para esclarecer qualquer duvida.

Atenciosamente,
Equipe WebMarcas
www.webmarcas.net | WhatsApp: (11) 91112-0225
```

### Fluxo de envio

1. Valida campos obrigatorios (valor, pelo menos 1 canal selecionado)
2. Se tem documento, faz upload para `documents` bucket e salva referencia
3. Chama `create-admin-invoice` com os dados de cobranca (valor, metodo, +10 dias)
4. Chama `send-multichannel-notification` com event_type `cobranca_gerada` e mensagem customizada
5. Se email selecionado, tambem chama `send-email` com o template completo + anexo
6. Registra atividade e exibe toast de sucesso

### Seguranca

- Nenhuma tabela nova sera criada
- Nenhuma tabela existente sera alterada
- Utiliza apenas edge functions e tabelas ja existentes (invoices, documents, notifications, client_activities)
- O componente e isolado e nao afeta nenhum outro fluxo do sistema

