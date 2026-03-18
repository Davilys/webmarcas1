UPDATE contract_templates 
SET content = REPLACE(
  REPLACE(
    REPLACE(
      content,
      '5.1 Os pagamentos à CONTRATADA serão efetuados mediante assinatura mensal recorrente no valor de R$ 1.194,00 (mil cento e noventa e quatro reais), cobrada automaticamente via cartão de crédito, com vigência a partir da data de assinatura deste contrato.
5.2 Taxas do INPI e anuidade: As taxas federais obrigatórias (GRU) serão de responsabilidade exclusiva do CONTRATANTE, devendo ser recolhidas diretamente ao INPI e a taxa de anuidade valor de R$1.194,00 a ser paga sempre do 05/12 de cada ano. Após essas etapas, o requerente receberá o certificado de registro válido por 10 anos, com direito à renovação.
5.3 O cadastro do CONTRATANTE junto ao INPI é realizado pela CONTRATADA previamente ao pagamento das taxas federais.
5.4 O atraso no pagamento da mensalidade implicará em acréscimo de multa e juros conforme cláusula sétima.',
      '5.1 Os pagamentos à CONTRATADA serão efetuados mediante assinatura mensal recorrente no valor de R$ 1.497,00 (mil quatrocentos e noventa e sete reais), cobrada automaticamente via cartão de crédito, com vigência a partir da data de assinatura deste contrato.
5.2 O valor da mensalidade será atualizado anualmente com base no salário mínimo nacional vigente no ano da cobrança. A correção será aplicada proporcionalmente à variação do salário mínimo, tomando como referência o valor vigente na data de assinatura deste contrato.
5.3 Taxas do INPI e anuidade: As taxas federais obrigatórias (GRU) serão de responsabilidade exclusiva do CONTRATANTE, devendo ser recolhidas diretamente ao INPI e a taxa de anuidade valor de R$1.497,00 a ser paga sempre do 05/12 de cada ano. Após essas etapas, o requerente receberá o certificado de registro válido por 10 anos, com direito à renovação.
5.4 O cadastro do CONTRATANTE junto ao INPI é realizado pela CONTRATADA previamente ao pagamento das taxas federais.
5.5 O atraso no pagamento da mensalidade implicará em acréscimo de multa e juros conforme cláusula sétima.'
    ),
    'R$ 1.194,00', 'R$ 1.497,00'
  ),
  'R$1.194,00', 'R$1.497,00'
),
updated_at = now()
WHERE id = 'd9840ec1-ac04-46ef-842e-03d29fe9fc64'