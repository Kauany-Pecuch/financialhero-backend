Funcionalidade: Endpoint de Próximos Vencimentos

  Cenário: Listar contas não pagas vencendo nos próximos 15 dias
    Dado um usuário com id 1 existe
    E hoje é 2026-05-10
    E o usuário tem contas:
      | nome      | valor | dataVencimento | paga | ativa | recorrente |
      | Água      | 100   | 2026-05-15     | não  | sim   | não        |
      | Alimento  | 200   | 2026-05-20     | não  | sim   | sim        |
      | Elétrica  | 150   | 2026-05-25     | não  | sim   | não        |
      | Paga      | 50    | 2026-05-12     | sim  | sim   | não        |
      | Inativa   | 75    | 2026-05-22     | não  | não   | não        |
      | Futura    | 300   | 2026-06-10     | não  | sim   | não        |
    Quando o cliente solicita contas a vencer com parâmetro padrão
    Então a API retorna contas a vencer com status 200
    E a resposta contém 3 contas
    E as contas estão ordenadas por dataVencimento ascendente

  Cenário: Filtrar contas a vencer por parâmetro customizado de dias
    Dado um usuário com id 2 existe
    E hoje é 2026-05-10
    E o usuário tem contas:
      | nome      | valor | dataVencimento | paga | ativa | recorrente |
      | Água      | 100   | 2026-05-15     | não  | sim   | não        |
      | Alimento  | 200   | 2026-05-25     | não  | sim   | não        |
      | Elétrica  | 150   | 2026-06-15     | não  | sim   | não        |
    Quando o cliente solicita contas a vencer com 7 dias
    Então a API retorna contas a vencer com status 200
    E a resposta contém 1 conta (Água)

  Cenário: Excluir contas pagas das próximas a vencer
    Dado um usuário com id 3 existe
    E hoje é 2026-05-10
    E o usuário tem contas:
      | nome     | valor | dataVencimento | paga | ativa | recorrente |
      | Água     | 100   | 2026-05-15     | sim  | sim   | não        |
      | Alimento | 200   | 2026-05-20     | não  | sim   | não        |
    Quando o cliente solicita contas a vencer com parâmetro padrão
    Então a API retorna contas a vencer com status 200
    E a resposta contém 1 conta (apenas Alimento)

  Cenário: Excluir contas inativas das próximas a vencer
    Dado um usuário com id 4 existe
    E hoje é 2026-05-10
    E o usuário tem contas:
      | nome     | valor | dataVencimento | paga | ativa | recorrente |
      | Água     | 100   | 2026-05-15     | não  | não   | não        |
      | Alimento | 200   | 2026-05-20     | não  | sim   | não        |
    Quando o cliente solicita contas a vencer com parâmetro padrão
    Então a API retorna contas a vencer com status 200
    E a resposta contém 1 conta (apenas Alimento)

  Cenário: Calcular diasFaltando corretamente
    Dado um usuário com id 5 existe
    E hoje é 2026-05-10
    E o usuário tem contas:
      | nome     | valor | dataVencimento | paga | ativa | recorrente |
      | Água     | 100   | 2026-05-12     | não  | sim   | não        |
      | Alimento | 200   | 2026-05-20     | não  | sim   | não        |
    Quando o cliente solicita contas a vencer com parâmetro padrão
    Então a API retorna contas a vencer com status 200
    E a primeira conta deve ter diasFaltando de 2
    E a segunda conta deve ter diasFaltando de 10

  Cenário: Retornar lista vazia quando não há próximos vencimentos
    Dado um usuário com id 6 existe
    E hoje é 2026-05-10
    E o usuário não tem contas a vencer nos próximos 15 dias
    Quando o cliente solicita contas a vencer com parâmetro padrão
    Então a API retorna contas a vencer com status 200
    E a resposta contém 0 contas
