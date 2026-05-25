Funcionalidade: Rastreamento de Pagamentos de Contas

  Cenário: Registrar pagamento de uma conta
    Dado um usuário autenticado com id 1
    E o usuário possui uma conta com:
      | campo           | valor      |
      | id              | 10         |
      | nome            | Água       |
      | valor           | 100.00     |
      | dataVencimento  | 2026-05-20 |
      | paga            | não        |
    Quando o usuário registra pagamento da conta com:
      | campo           | valor      |
      | contaId         | 10         |
      | dataPagamento   | 2026-05-18 |
      | valorPago       | 100.00     |
      | metodoPagamento | Transferência |
    Então a API retorna status 201
    E a conta é marcada como paga
    E a resposta contém o registro do pagamento

  Cenário: Validar valor pago diferente do valor da conta
    Dado um usuário autenticado com id 1
    E o usuário possui uma conta com valor 100.00 e id 11
    Quando o usuário tenta registrar pagamento com valor 80.00 para a conta 11
    Então a API retorna status 400
    E a resposta contém mensagem de aviso "Valor pago diferente do valor da conta"

  Cenário: Listar histórico de pagamentos do usuário
    Dado um usuário autenticado com id 1
    E o usuário possui os seguintes pagamentos:
      | contaNome | valorPago | dataPagamento | metodo          |
      | Água      | 100.00    | 2026-05-01    | Transferência   |
      | Luz       | 150.00    | 2026-05-05    | Débito          |
      | Internet  | 89.90     | 2026-05-10    | Cartão Crédito  |
    Quando o usuário solicita histórico de pagamentos
    Então a API retorna status 200
    E a resposta contém 3 registros de pagamento
    E os pagamentos estão ordenados por data decrescente

  Cenário: Filtrar pagamentos por período
    Dado um usuário autenticado com id 1
    E o usuário possui os seguintes pagamentos:
      | contaNome | valorPago | dataPagamento |
      | Água      | 100.00    | 2026-04-15    |
      | Luz       | 150.00    | 2026-05-05    |
      | Internet  | 89.90     | 2026-05-15    |
      | Telefone  | 70.00     | 2026-06-01    |
    Quando o usuário solicita pagamentos entre 2026-05-01 e 2026-05-31
    Então a API retorna status 200
    E a resposta contém 2 registros (Luz e Internet)

  Cenário: Gerar comprovante de pagamento
    Dado um usuário autenticado com id 1
    E o usuário possui um pagamento com id 50 registrado
    Quando o usuário solicita o comprovante do pagamento 50
    Então a API retorna status 200
    E a resposta contém os dados do comprovante:
      | campo           | tipo        |
      | contaNome       | string      |
      | valorPago       | decimal     |
      | dataPagamento   | date        |
      | metodoPagamento | string      |
      | dataComprovante | timestamp   |
      | numeroComprovante | string    |

  Cenário: Rejeitar pagamento de conta já paga
    Dado um usuário autenticado com id 1
    E o usuário possui uma conta com id 12 já marcada como paga
    Quando o usuário tenta registrar novo pagamento para a conta 12
    Então a API retorna status 400
    E a resposta contém mensagem de erro "Esta conta já foi paga"

  Cenário: Calcular total pago no período
    Dado um usuário autenticado com id 1
    E o usuário realizou os seguintes pagamentos em maio:
      | valor   |
      | 100.00  |
      | 150.00  |
      | 89.90   |
      | 50.00   |
    Quando o usuário solicita resumo de pagamentos de maio
    Então a API retorna status 200
    E a resposta contém totalPago igual a 389.90
    E a resposta contém quantidadePagamentos igual a 4
