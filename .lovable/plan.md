

# Busca com Autocomplete no Seletor de Cliente (Enviar Documento)

## Problema

O seletor de cliente no dialogo "Enviar Documento" da pagina admin de Documentos usa um dropdown simples (`Select`), dificultando encontrar clientes em uma base com mais de 2.300 registros. Precisa de um campo de busca com autocomplete.

## Sobre o Tipo de Documento

O mapeamento de tipos ja funciona corretamente. Quando o admin seleciona um tipo (ex: "Procuracao"), o documento e salvo com `document_type: 'procuracao'` e aparece automaticamente na aba correspondente na area do cliente. Nenhuma alteracao necessaria nessa parte.

## Solucao

Substituir o `<Select>` de cliente por um componente de busca com autocomplete usando `Command` (cmdk), com busca server-side no Supabase. Mesmo padrao ja utilizado no `CreateContractDialog.tsx`.

## Mudancas Tecnicas

### Arquivo: `src/pages/admin/Documentos.tsx`

Dentro do componente `UploadDialog`:

1. **Remover** o `<Select>` de cliente (linhas 421-431)
2. **Adicionar** um campo `<Input>` com busca por nome/email/telefone
3. **Usar** `Command` com `shouldFilter={false}` para listar resultados do servidor
4. **Busca server-side**: query ao Supabase com `ilike` no campo digitado, limitado a 20 resultados
5. **Exibir** nome e email de cada resultado para facilitar identificacao
6. **Ao selecionar**, preencher o `user_id` e mostrar o nome selecionado com botao de limpar (X)

### Comportamento esperado

- Campo vazio: placeholder "Buscar por nome ou email..."
- Ao digitar (minimo 2 caracteres): lista de clientes filtrada aparece abaixo
- Ao selecionar: campo mostra o nome do cliente com opcao de limpar
- Clicar fora: lista fecha automaticamente

### Nenhum outro arquivo modificado

- Nenhuma migracao de banco necessaria
- Nenhuma Edge Function alterada
- A area do cliente ja categoriza documentos corretamente pelas abas

