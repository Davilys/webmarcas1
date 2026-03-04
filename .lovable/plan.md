

## Correção: Permitir múltiplos anexos no painel de Serviços

### Problema
Atualmente o estado `file` é um único `File | null`. Ao selecionar outro arquivo, o anterior é substituído. O usuário quer anexar quantos arquivos quiser.

### Solução

**Arquivo: `src/components/admin/clients/ServiceActionPanel.tsx`**

1. **Trocar estado de `File | null` para `File[]`**:
   - `const [files, setFiles] = useState<File[]>([]);`

2. **`handleFileChange`**: Em vez de substituir, adicionar ao array:
   ```typescript
   const handleFileChange = (e) => {
     const newFiles = Array.from(e.target.files || []);
     setFiles(prev => [...prev, ...newFiles]);
     e.target.value = ''; // permite re-selecionar mesmo arquivo
   };
   ```
   - Também adicionar `multiple` ao `<input type="file">`

3. **UI de anexos**: Renderizar lista de chips (um por arquivo), cada um com botão X para remover individualmente.

4. **`handleSend`**: Fazer upload de **todos** os arquivos em loop, salvando cada referência na tabela `documents` e coletando todas as URLs para incluir na notificação.

5. **Incluir `accept="*"` e `multiple`** no input para permitir qualquer formato e múltipla seleção.

