
# Upgrade do Motor de Viabilidade: 5.000 Marcas + GPT-5.2 + Pesquisa Real

## O Que Existe Hoje e o Que Está Errado

### Problema 1: Base de marcas famosas é minúscula (~100 marcas)
A lista `FAMOUS_BRANDS` no topo da edge function tem apenas ~100 nomes. Isso significa que marcas como "Havaianas", "Embraer", "Correios", "JBS", "Gerdau", "Porto Seguro", "Localiza", etc. passam sem bloqueio.

### Problema 2: IA gera laudo com GPT-4o sem pesquisar antes
O módulo `generateLaudo` chama `https://api.openai.com/v1/chat/completions` com o modelo `gpt-4o` diretamente. Ele NÃO pesquisa nada — recebe apenas os dados que os outros módulos já coletaram.

O usuário quer que a IA use `openai/gpt-5.2` via **Lovable AI Gateway** (`https://ai.gateway.lovable.dev`) que é o serviço já configurado com `LOVABLE_API_KEY`.

### Problema 3: Pesquisa de colidência pode ser enriquecida com busca direta da IA
O Módulo 3 (Firecrawl) já pesquisa no Google/LinkedIn/Instagram. Mas a IA poderia receber um contexto ainda mais rico com uma busca específica de colidência antes de emitir o laudo.

---

## Solução — 3 Mudanças Cirúrgicas em `supabase/functions/inpi-viability-check/index.ts`

### Mudança 1: Base de 5.000 Marcas Famosas

Substituir a lista de ~100 por uma lista expandida de **5.000 nomes** cobrindo:

**Categorias:**
- Marcas brasileiras de alto renome (Petrobras, Itaú, Bradesco, Natura, Embraer, Havaianas, Totvs, Magazine Luiza, etc.)
- Marcas internacionais com presença forte no Brasil (Apple, Nike, Adidas, Samsung, Google, Amazon, etc.)
- Variações de grafia, abreviações e nomes populares (Ex: "Mc" → "McDonalds", "BK" → "Burger King")
- Marcas por setor: varejo, moda, alimentos, bebidas, bancos, seguros, saúde, construção, automóveis, tecnologia, telecomunicações, etc.
- Grandes franquias instaladas no Brasil
- Marcas com proteção de alto renome registrada no INPI (lista oficial inclui ~600 marcas)

Na prática, a lista completa de 5.000 nomes será gerada como um array estruturado por categoria, armazenado no topo da edge function. Por ser um array de strings em memória (sem banco de dados), não há custo de consulta — é apenas uma checagem `.includes()` ou `.some()`.

**Estrutura:**
```ts
const FAMOUS_BRANDS_EXTENDED: string[] = [
  // === BANCOS E FINANCEIRAS ===
  'itau', 'itaú', 'bradesco', 'santander', 'banco do brasil', 'bb', 'caixa',
  'caixa economica', 'nubank', 'inter', 'c6bank', 'c6', 'xp investimentos', 'xp inc',
  'btg pactual', 'btg', 'modal', 'sofisa', 'picpay', 'pagseguro', 'mercado pago',
  'neon', 'original', 'will bank', 'next bank', 'agibank', 'bmg', 'pan', 'banrisul',
  'sicoob', 'sicredi', 'uniprime', 'cresol', 'ailos', 'unicred',
  // === SEGUROS ===
  'porto seguro', 'porto', 'sulamerica', 'sul america', 'bradesco saude', 'unimed',
  'hapvida', 'notredame', 'allianz', 'liberty', 'mapfre', 'tokio marine',
  'azul seguros', 'sompo', 'hdi seguros',
  // ... (5.000 entradas no total)
];
```

A lógica de checagem existente (`isFamousBrand`) continuará a mesma — apenas a lista ficará maior.

---

### Mudança 2: Trocar GPT-4o → GPT-5.2 via Lovable AI Gateway

**Código atual (linha 523):**
```ts
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${openAIKey}`, ... },
  body: JSON.stringify({ model: 'gpt-4o', ... })
});
```

**Código novo:**
```ts
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'openai/gpt-5.2', ... })
});
```

Isso elimina a necessidade de usar a `OPENAI_API_KEY` para o laudo — o `LOVABLE_API_KEY` já está configurado. A qualidade e capacidade de raciocínio do `gpt-5.2` é superior ao `gpt-4o`, especialmente para análise jurídica detalhada.

---

### Mudança 3: Adicionar Módulo de Pesquisa de Colidência Web Dedicada (pré-laudo)

Antes de chamar `generateLaudo`, adicionar uma 4ª busca Firecrawl específica para colidência de marca:

```ts
async function searchBrandCollision(brandName: string, businessArea: string, firecrawlKey: string): Promise<string> {
  // Busca 1: marca no Google de forma geral
  const [googleSearch, trademarkSearch] = await Promise.allSettled([
    fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `marca registrada "${brandName}" ${businessArea} INPI colidência`,
        limit: 5,
        scrapeOptions: { formats: ['markdown'] }
      })
    }),
    // Busca no Trademark Now e bases internacionais
    fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${firecrawlKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `"${brandName}" trademark registered brand ${businessArea}`,
        limit: 5,
        scrapeOptions: { formats: ['markdown'] }
      })
    })
  ]);

  // Agrega snippets relevantes e retorna como contexto adicional para a IA
  let collisionContext = '';
  // ... processa resultados e retorna texto
  return collisionContext;
}
```

Esse contexto é passado ao `generateLaudo` como campo adicional `collisionWebContext`, enriquecendo o prompt.

---

## Resumo das Alterações

| Mudança | Localização | Impacto |
|---|---|---|
| Lista de 5.000 marcas famosas | Topo do arquivo, constante `FAMOUS_BRANDS` | Detecção de marcas de renome muito mais precisa |
| Trocar GPT-4o → GPT-5.2 via gateway Lovable | Função `generateLaudo`, linha ~523 | Laudo mais preciso, sem custo extra de API key |
| Novo módulo de colidência web | Nova função `searchBrandCollision` | Análise de colidência real com pesquisa Google via Firecrawl |
| Remover dependência de `OPENAI_API_KEY` no laudo | Função `generateLaudo` | Usa `LOVABLE_API_KEY` já disponível |

---

## O Que NÃO Muda

- Módulo 1 (WIPO/INPI) — continua igual
- Módulo 2 (CNPJ.ws/Receita Federal) — continua igual
- Módulo 3 (Firecrawl Web Presence) — continua igual
- Toda a interface do usuário (`ViabilityResultDisplay`, etc.)
- Estrutura do PDF do laudo
- Lógica de nível de viabilidade (high/medium/low/blocked)

---

## Arquivo a Modificar

**`supabase/functions/inpi-viability-check/index.ts`** — único arquivo alterado.

Após salvar, o deploy é automático.
