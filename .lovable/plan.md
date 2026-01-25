

## Plano: Corrigir Erro 404 no Deploy Vercel

### Problema
O site é uma **Single Page Application (SPA)** que usa `BrowserRouter`. A Vercel precisa de instruções para redirecionar todas as rotas para o `index.html`, permitindo que o React Router gerencie a navegação.

---

### Solução

**Criar arquivo `vercel.json` na raiz do projeto:**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

### O que isso faz?

| Requisição | Sem vercel.json | Com vercel.json |
|------------|-----------------|-----------------|
| `/admin/dashboard` | ❌ 404 | ✅ Serve index.html → React Router resolve |
| `/cliente/processos` | ❌ 404 | ✅ Serve index.html → React Router resolve |
| `/registrar` | ❌ 404 | ✅ Serve index.html → React Router resolve |
| `/` | ✅ OK | ✅ OK |

---

### Passos Após a Implementação

1. **Commit e push** das alterações para o repositório
2. **Vercel detectará** automaticamente o novo arquivo
3. **Novo deploy** será acionado
4. **Testar** digitando URLs diretamente

---

### Arquivo a Criar

| Arquivo | Localização | Conteúdo |
|---------|-------------|----------|
| `vercel.json` | Raiz do projeto | Regra de rewrite para SPA |

---

### Bônus (Opcional)

Também posso criar o arquivo `public/_redirects` para garantir compatibilidade caso você decida usar a **Netlify** no futuro:

```text
/*    /index.html   200
```

