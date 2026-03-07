

## Problema Identificado

A IA está retornando classes genéricas (ex: "Publicidade, gestão de negócios") em vez de descrições contextualizadas ao ramo do cliente. O prompt atual já tem instruções, mas a IA não está seguindo. Dois problemas:

1. **Prompt fraco** — precisa de reforço mais agressivo com exemplos múltiplos e regras negativas explícitas
2. **Fallback default genérico** — quando a IA falha, o fallback `default` retorna classes 35/41/42 com descrições genéricas
3. **Token limit baixo** — `max_completion_tokens: 600` pode estar cortando a resposta da IA

## Plano de Correção

### 1. Reforçar o prompt da função `suggestClassesWithAI`

- Adicionar **3 exemplos variados** (sorveteria, advocacia, pet shop) para a IA entender o padrão
- Adicionar regras negativas explícitas: "PROIBIDO usar termos como 'Publicidade, gestão de negócios', 'Educação, treinamento e cultura', 'Serviços científicos e tecnológicos'"
- Instruir: "Cada descrição DEVE mencionar o nome do ramo do cliente (ex: se ramo é 'sorveteria', escreva 'sorvetes', 'picolés')"
- Aumentar `max_completion_tokens` para 800

### 2. Melhorar o fallback default

- Tornar o fallback `default` dinâmico: inserir o `businessArea` nas descrições ao invés de texto fixo genérico
- Ex: "Classe 35 – Comércio, vendas e gestão do seu negócio de **{businessArea}**..."

### 3. Reforçar o prompt do laudo (função `generateAnalysis`)

- Já está bom mas adicionar regra: "Se a IA retornou classes genéricas, reformule as descrições para serem específicas ao ramo"

### 4. Validação pós-IA

- Após receber resposta da IA, verificar se as descrições contêm pelo menos uma palavra do `businessArea` — se não, rejeitar e usar fallback contextualizado

### Arquivos a modificar

- `supabase/functions/inpi-viability-check/index.ts` — prompt da `suggestClassesWithAI`, fallback default, e validação

