

# Plano: Contratos por Plano + Fluxo de Checkout por Plano

## O que precisa ser feito

### 1. Criar 2 novos modelos de contrato (Premium e Corporativo)

Adicionar em `useContractTemplate.ts` dois novos templates default baseados no contrato padrao existente, com as seguintes diferenças:

**Contrato Premium (R$398/mês)**:
- Título: "CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE ASSESSORAMENTO PREMIUM PARA REGISTRO DE MARCA JUNTO AO INPI"
- Cláusula 5.1: pagamento recorrente mensal de R$398,00
- Cláusula 5.2: "Taxas do INPI e anuidade: As taxas federais obrigatórias (GRU) serão de responsabilidade exclusiva do CONTRATANTE, devendo ser recolhidas diretamente ao INPI e a taxa de anuidade valor de R$398,00 a ser paga sempre do 05/12 de cada ano. Após essas etapas, o requerente receberá o certificado de registro válido por 10 anos, com direito à renovação."
- Cláusula 10.3: Remover cobrança separada de publicações/despachos (está tudo incluso no Premium) — substituir por: "A CONTRATADA se compromete a cumprir todas as exigências, oposições e recursos necessários sem custo adicional de honorários, estando estes já contemplados na mensalidade do Plano Premium."

**Contrato Corporativo (R$1.194/mês)**:
- Mesmo que Premium mas com título "CONTRATO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS CORPORATIVO..."
- Cláusula 5.1: pagamento recorrente mensal de R$1.194,00
- Cláusula 5.2: mesma do Premium, com anuidade de R$1.194,00
- Cláusula 10.3: mesma do Premium (tudo incluso)
- **Nova Cláusula 10.4**: "O Plano Corporativo contempla registros de marcas ilimitados, vinculados exclusivamente ao CPF ou CNPJ do CONTRATANTE que realizou a contratação. Todas as marcas registradas sob este plano deverão ser tituladas no mesmo CPF ou CNPJ cadastrado. Caso o CONTRATANTE deseje registrar marcas em outro CPF ou CNPJ, deverá contratar um novo plano específico para tal finalidade."

### 2. Fluxo de checkout por plano selecionado

**PricingSection.tsx**: Alterar os botões dos planos Premium e Corporativo para navegar para `/cliente/registrar-marca?plano=premium` ou `?plano=corporativo` em vez de scrollToForm. Essencial mantém o scroll para busca na landing.

**RegistrarMarca.tsx**: Ler query param `plano` da URL. Armazenar em state. Passar para PaymentStep e ContractStep.

**PaymentStep.tsx**: Quando `plano=premium` ou `plano=corporativo`:
- Não mostrar opções PIX/Cartão/Boleto tradicionais
- Mostrar apenas o valor mensal do plano (R$398 ou R$1.194) com informação que será recorrente via Asaas
- Forma de pagamento: apenas cartão de crédito (recorrente)

**ContractStep.tsx**: Usar o template correto baseado no plano:
- Sem plano ou `essencial` → template padrão atual
- `premium` → template Premium
- `corporativo` → template Corporativo
- Usar `useContractTemplate('Contrato Premium...')` ou `('Contrato Corporativo...')`

### 3. Renderização consistente (mesmo papel timbrado)

Os novos contratos usam exatamente o mesmo `ContractRenderer` e `generateContractPrintHTML` — mesmo letterhead, mesma barra laranja, mesmo estilo. A única diferença é o conteúdo textual (cláusulas) e o título no box azul escuro.

Para que o `ContractRenderer` exiba o título correto no box azul, passaremos o título do contrato como prop e ajustaremos o texto do `contract-title-box`.

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useContractTemplate.ts` | Adicionar 2 templates default (Premium/Corporativo) + lógica `replaceContractVariables` para planos recorrentes |
| `src/components/sections/PricingSection.tsx` | Botões Premium/Corporativo navegam para checkout com query param |
| `src/pages/cliente/RegistrarMarca.tsx` | Ler `?plano=` da URL, passar para PaymentStep/ContractStep |
| `src/components/cliente/checkout/PaymentStep.tsx` | Modo recorrente quando plano != essencial |
| `src/components/cliente/checkout/ContractStep.tsx` | Selecionar template correto por plano |
| `src/components/contracts/ContractRenderer.tsx` | Aceitar título customizado no box azul |

### O que NÃO muda
- Plano Essencial: fluxo inteiro permanece idêntico
- Papel timbrado / visual do contrato: idêntico
- Assinatura / blockchain / certificação: idêntico
- Tabelas existentes: nenhuma alteração

