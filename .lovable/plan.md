
# Correcao do Gerador de HTML para Documentos (Procuracao/Distrato/Contrato)

## Problema Identificado

A funcao `generateDocumentPrintHTML` em `DocumentRenderer.tsx` (usada pelo botao "Gerar Novo Link") gera HTML com cabecalhos e layout **diferentes** do modelo padrao que esta em `generateContractPrintHTML` (ContractRenderer.tsx). Isso causa:

1. **Procuracao**: Falta o subtitulo ("Instrumento Particular de Procuracao para fins de Registro de Marca") e a caixa amarela com o texto legal sobre os poderes do procurador
2. **Distrato**: O titulo aparece generico em vez de "ACORDO DE DISTRATO", e a caixa de aviso legal mostra texto de contrato em vez de texto especifico de distrato
3. **Contrato**: Este tipo ja funciona corretamente

## Solucao

Atualizar a funcao `generateDocumentPrintHTML` em `src/components/contracts/DocumentRenderer.tsx` para usar as mesmas secoes de cabecalho por tipo de documento que `generateContractPrintHTML` (ContractRenderer.tsx) ja usa corretamente.

## Mudancas Tecnicas

### Arquivo: `src/components/contracts/DocumentRenderer.tsx`

Na funcao `generateDocumentPrintHTML` (linhas 515-567), ajustar:

**1. Titulo do documento (linhas 515-522)**
- Procuracao: manter "PROCURACAO PARA REPRESENTACAO JUNTO AO INPI"
- Distrato: mudar para "ACORDO DE DISTRATO" (em vez de "Acordo de Distrato de Parceria - Anexo I")
- Contrato: manter "CONTRATO"

**2. Caixa de titulo (linhas 563-567)**
- Procuracao: nenhuma caixa de titulo (manter vazio), mas adicionar subtitulo em italico
- Distrato: ja correto ("INSTRUMENTO PARTICULAR DE DISTRATO...")
- Contrato: ja correto

**3. Aviso legal / Legal Notice (linhas 525-536)**
- Procuracao: adicionar caixa amarela especifica com texto sobre poderes do procurador (igual ao que esta em `generateContractPrintHTML` linha 687-690)
- Distrato: usar texto especifico de distrato ("As partes abaixo qualificadas resolvem, de comum acordo, distratar...")
- Contrato: manter texto atual

**4. Estilo do titulo principal**
- Para procuracao: remover sublinhado (text-decoration: underline) do titulo, pois procuracoes nao usam sublinhado no modelo padrao

**5. Subtitulo para procuracao**
- Adicionar linha com `<p style="text-align:center; font-style:italic; margin-bottom:24px;">Instrumento Particular de Procuracao para fins de Registro de Marca</p>` apos o titulo da procuracao

### Resultado da mudanca no HTML gerado:

**Procuracao:**
- Logo + barra gradiente
- Titulo: "PROCURACAO PARA REPRESENTACAO JUNTO AO INPI" (sem sublinhado)
- Subtitulo italico: "Instrumento Particular de Procuracao para fins de Registro de Marca"
- Caixa amarela: texto sobre poderes do procurador junto ao INPI
- Conteudo do template com dados do cliente
- Rodape

**Distrato (com/sem multa):**
- Logo + barra gradiente
- Titulo: "ACORDO DE DISTRATO" (sublinhado)
- Caixa azul: "INSTRUMENTO PARTICULAR DE DISTRATO DE CONTRATO DE PRESTACAO DE SERVICOS"
- Caixa amarela: texto especifico sobre distrato
- Conteudo do template com dados do cliente
- Rodape

**Contrato:**
- Sem alteracoes (ja funciona corretamente)

### Nenhuma outra mudanca necessaria
- A funcao `generateNewContractLink` no ContractDetailSheet.tsx ja esta correta na substituicao de variaveis e na chamada a `generateDocumentPrintHTML`
- O problema esta exclusivamente no layout HTML gerado por `generateDocumentPrintHTML`
