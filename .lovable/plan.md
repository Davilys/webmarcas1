
Objetivo: garantir que, ao criar recurso (independente do agente Mazzola/Guerra/Nascimento), o rascunho sempre comece com o bloco formal obrigatório antes da Seção I, no formato jurídico que você mostrou na imagem.

Diagnóstico confirmado no código e dados atuais:
- O rascunho exibido em “Rascunho do Recurso” vem direto de `resource_content` retornado pela função de backend `process-inpi-resource`.
- Hoje o cabeçalho está só como instrução de prompt (IA), sem validação pós-geração.
- Resultado real já salvo no banco mostra casos iniciando direto em `I – SÍNTESE...`, sem o preâmbulo obrigatório.

Plano de correção

1) Tornar o cabeçalho obrigatório por código (não só por prompt) na geração principal
- Arquivo: `supabase/functions/process-inpi-resource/index.ts`
- Criar helpers:
  - `buildMandatoryOpeningBlock(...)` para montar exatamente o bloco inicial:
    - `RECURSO ADMINISTRATIVO – {tipo}`
    - `MARCA: {marca em caixa alta}`
    - endereçamento formal
    - linhas de metadados (Processo, Marca, Classe, Titular/Requerente, Oponente, Procurador)
  - `extractBodyFromSectionI(...)` para localizar o início real do conteúdo técnico (`I – ...`) e remover qualquer abertura inconsistente.
  - `enforceMandatoryOpening(...)` para sempre reconstruir o documento como:
    `bloco obrigatório + linha em branco + corpo desde a Seção I`.
- Aplicar essa normalização:
  - no fluxo normal (concatenação Passo 1 + Passo 2),
  - e também no retorno parcial (quando Passo 2 falhar e hoje retorna só Passo 1).

2) Garantir robustez dos dados do cabeçalho
- No mesmo arquivo, adicionar fallback quando extração vier incompleta:
  - usar `extractedData` como fonte principal;
  - complementar por regex no texto gerado (processo/marca/classe/titular/oponente), se necessário;
  - manter placeholders seguros (`N/I`) quando algo não existir.
- Padronizar formatação:
  - número de processo sem ruído visual,
  - marca em caixa alta na linha de título (`MARCA:`),
  - marca com natureza na linha de metadado (`Marca: ... (nominativa)` quando disponível).

3) Blindar também o fluxo “Ajustar com IA”
- Arquivo: `supabase/functions/adjust-inpi-resource/index.ts`
- Após receber `adjusted_content`, aplicar a mesma `enforceMandatoryOpening(...)` para impedir que ajustes removam ou alterem o cabeçalho obrigatório.
- Isso evita regressão após revisões sucessivas.

4) Enviar contexto necessário no ajuste pelo frontend
- Arquivo: `src/pages/admin/RecursosINPI.tsx`
- Em `handleRequestAdjustment`, enviar também `resourceType` e `extractedData` no payload da chamada de ajuste, para o backend conseguir reconstruir o cabeçalho com dados corretos do caso.

5) Corrigir também recursos já existentes sem exigir nova geração
- Arquivo: `src/pages/admin/RecursosINPI.tsx`
- Ao abrir rascunho para revisão/edição, detectar rascunhos que começam em `I – ...` sem cabeçalho.
- Aplicar normalização local imediata (mesma regra), atualizar `draftContent` e persistir em `draft_content` para não perder a correção do item já criado.

6) Validação (checklist de aceite)
- Gerar 3 recursos de “Manifestação à Oposição” (um por agente) e confirmar que todos iniciam com o bloco obrigatório completo.
- Executar “Ajustar com IA” em cada um e validar que o cabeçalho permanece intacto.
- Validar um recurso antigo já salvo sem cabeçalho: ao abrir para revisão, deve ser autocorrigido.
- Conferir que o restante da peça continua com 10–20 páginas e sem perda de conteúdo técnico.

Detalhes técnicos essenciais
- Arquivos-alvo:
  - `supabase/functions/process-inpi-resource/index.ts`
  - `supabase/functions/adjust-inpi-resource/index.ts`
  - `src/pages/admin/RecursosINPI.tsx`
- Estratégia principal: padronização determinística pós-IA (server-side) + fallback para itens legados no frontend.
- Resultado esperado: início sempre coerente com o padrão jurídico institucional, independentemente do agente escolhido.
