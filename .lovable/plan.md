
# Notificacao Extrajudicial - Plano Atualizado

## Objetivo

Adicionar "Notificacao Extrajudicial" como novo tipo no fluxo de criacao de recursos INPI. Diferente dos recursos INPI, este documento usa a identidade institucional da WebMarcas e a assinatura de Davilys como procurador (sem CPF).

## Fluxo do Usuario

1. Clica em "Criar Recurso com IA"
2. Seleciona o card "Notificacao Extrajudicial"
3. Escolhe estrategia juridica e agente especialista
4. **Novo passo - Formulario com:**
   - **Dados do Notificante**: Nome/Razao Social, CPF/CNPJ, Endereco, Numero do processo INPI, Numero do registro da marca
   - **Dados do Notificado** (infrator): Nome/Razao Social, CPF/CNPJ, Endereco
   - **Campo de instrucoes**: textarea livre para descrever o contexto da infracao (como, onde, ha quanto tempo a marca esta sendo usada indevidamente)
5. Upload de multiplos documentos (PDFs, fotos, provas)
6. IA gera a notificacao extrajudicial completa
7. Revisao, ajustes e PDF final

## Identidade do Documento

A notificacao extrajudicial NAO e um recurso no INPI. Portanto, o documento segue regras proprias:

- **Cabecalho**: papel timbrado da WebMarcas Intelligence PI (logo, endereco, contato) - mesmo padrao visual dos contratos
- **Encerramento/Assinatura**: Somente o nome "Davilys Danques de Oliveira Cunha" como "Procurador", SEM CPF
- **Imagem da assinatura**: a mesma ja utilizada nos documentos e procuracoes (davilys-signature.png)
- **Rodape**: dados institucionais da WebMarcas (endereco, telefone, email, site)
- **Nao incluir**: "Pede deferimento" nem referencias ao INPI como destinatario - o destinatario e o Notificado

## Estrutura da Notificacao Gerada pela IA

Documento com minimo 2.000 palavras contendo:

1. **Cabecalho Institucional** - WebMarcas Intelligence PI, CNPJ 39.528.012/0001-29, endereco
2. **Identificacao das Partes** - Notificante (dados do formulario) e Notificado (dados do formulario)
3. **Dos Fatos** - Narrativa detalhada do uso indevido baseada nas instrucoes do usuario e documentos anexados
4. **Do Direito** - LPI arts. 129, 130, 189, 190; Codigo Civil arts. 186, 927, 944; CF art. 5, XXIX
5. **Da Notificacao e Intimacao** - Exigencias claras: cessar uso, retirar materiais, prazo de 15/30 dias
6. **Das Consequencias** - Medidas judiciais cabiveis (acao de abstencao, busca e apreensao, indenizacao)
7. **Encerramento** - Data, assinatura de Davilys Danques de Oliveira Cunha (Procurador), sem CPF

## Alteracoes Tecnicas

### 1. Frontend - RecursosINPI.tsx

- Adicionar tipo `notificacao_extrajudicial` nos mapeamentos existentes
- Novo step `notificacao-data` com formulario dividido em 3 secoes:
  - Dados do Notificante (6 campos)
  - Dados do Notificado (4 campos)
  - Instrucoes ao agente (textarea)
- Suporte a upload de multiplos arquivos (PDFs e imagens)
- Enviar dados extras para a edge function

### 2. Edge Function - process-inpi-resource/index.ts

- Adicionar `notificacao_extrajudicial` no `RESOURCE_TYPE_LABELS`
- Criar funcao `buildNotificacaoPrompt()` com prompt especifico:
  - Recebe dados do notificante e notificado
  - Instrucoes do usuario como contexto
  - Estrutura obrigatoria da notificacao extrajudicial
  - Encerramento com nome "Davilys Danques de Oliveira Cunha, Procurador" (sem CPF)
  - Dados da WebMarcas Intelligence PI no cabecalho
- Aceitar campos `notificanteData`, `notificadoData`, `userInstructions` no body
- Suportar array de arquivos

### 3. PDF Preview - INPIResourcePDFPreview.tsx

- Detectar tipo `notificacao_extrajudicial` para ajustar o bloco de assinatura:
  - Mostrar nome "Davilys Danques de Oliveira Cunha"
  - Titulo "Procurador" (sem CPF - removendo a linha que exibe CPF)
  - Manter a mesma imagem de assinatura (davilys-signature.png)
- Ajustar o badge/titulo do documento para "NOTIFICACAO EXTRAJUDICIAL"
- Remover "Pede deferimento" e "Termos em que" do encerramento para este tipo
- Nome do arquivo PDF: `Notificacao_Extrajudicial_[marca]_[data].pdf`

### 4. Tabela inpi_resources - Sem alteracao

Campos existentes acomodam os dados:
- `resource_type` = `'notificacao_extrajudicial'`
- `holder` = dados do notificante
- `examiner_or_opponent` = dados do notificado
- Demais campos (brand_name, process_number, draft_content, final_content) se mantem

## Arquivos a Alterar

| Arquivo | Alteracao |
|---------|-----------|
| src/pages/admin/RecursosINPI.tsx | Novo tipo, novo step com formulario, multiplos arquivos |
| supabase/functions/process-inpi-resource/index.ts | Novo prompt, novos campos, encerramento sem CPF |
| src/components/admin/INPIResourcePDFPreview.tsx | Assinatura sem CPF, titulo ajustado para notificacao |
