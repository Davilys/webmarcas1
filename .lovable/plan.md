
# Melhorias no Formulario "Enviar Documento"

## Mudancas

### 1. Botao "Enviar Documento" no topo da pagina
Mover o botao `Dialog` (atualmente no final da barra de filtros) para o inicio, ao lado do titulo. Renomear de "Enviar" para "Enviar Documento".

### 2. Preencher nome do documento automaticamente com o tipo selecionado
Quando o usuario mudar o tipo de documento no formulario, o campo "Nome do documento" sera preenchido automaticamente com o label do tipo (ex: selecionar "Procuracao" preenche "Procuracao"). O usuario ainda podera editar manualmente.

### 3. Scroll no Select de clientes dentro do dialog
Adicionar `className="max-h-60 overflow-y-auto"` no `SelectContent` do seletor de cliente dentro do dialog, garantindo que a lista de clientes seja rolavel com o mouse.

### 4. Protocolo de registro ao enviar
Gerar automaticamente um protocolo de registro (ex: `DOC-20260209-XXXXX`) ao salvar o documento. Esse protocolo sera exibido na tabela de documentos.

## Detalhes Tecnicos

### Arquivo: `src/pages/admin/Documentos.tsx`

1. **Reorganizar layout do header**: Mover o `Dialog` do bloco de filtros para ficar logo apos o titulo, na mesma linha.

2. **Auto-preencher nome**: No `onValueChange` do Select de tipo no formulario, atualizar tambem `formData.name` com o label correspondente do `documentTypes`.

3. **Scroll no SelectContent**: Adicionar `className="max-h-60 overflow-y-auto"` no `SelectContent` do campo "Cliente *" dentro do dialog.

4. **Protocolo de registro**: Gerar um codigo unico no formato `DOC-YYYYMMDD-NNNNN` (data + numero aleatorio de 5 digitos) e salvar no campo `name` como prefixo ou em um campo separado. Como nao existe um campo `protocol` na tabela `documents`, o protocolo sera incluido como parte dos metadados ou adicionado como coluna via migracao SQL.

### Migracao SQL (para protocolo)
Adicionar coluna `protocol` na tabela `documents`:
```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS protocol text;
```

### Geracao do protocolo
```typescript
const generateProtocol = () => {
  const now = new Date();
  const date = now.toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `DOC-${date}-${rand}`;
};
```

O protocolo sera gerado automaticamente no `handleUploadComplete` e salvo junto com o documento. Sera exibido na tabela ao lado do nome do documento.
