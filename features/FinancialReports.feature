Funcionalidade: Relatórios e Análises Financeiras

  Cenário: Gerar relatório mensal de despesas
    Dado um usuário autenticado com id 1
    E o usuário possui contas pagas em maio:
      | nome       | valor | categoria | dataPagamento |
      | Água       | 100   | Utilidade | 2026-05-05    |
      | Luz        | 150   | Utilidade | 2026-05-08    |
      | Alimento   | 200   | Alimentação | 2026-05-10   |
      | Internet   | 89.90 | Utilidade | 2026-05-12    |
    Quando o usuário solicita relatório de despesas para maio
    Então a API retorna status 200
    E a resposta contém o totalGasto igual a 539.90
    E a resposta contém a distribuição por categoria

  Cenário: Comparar despesas entre períodos
    Dado um usuário autenticado com id 1
    E o usuário possui contas pagas em abril com total 400.00
    E o usuário possui contas pagas em maio com total 539.90
    Quando o usuário solicita comparação entre abril e maio
    Então a API retorna status 200
    E a resposta contém:
      | período | total   | variacao |
      | Abril   | 400.00  | -        |
      | Maio    | 539.90  | 34.97%   |
    E a resposta inclui análise de crescimento

  Cenário: Identificar categorias com maior despesa
    Dado um usuário autenticado com id 1
    E o usuário possui as despesas categorizadas em maio:
      | categoria     | total   |
      | Utilidade     | 339.90  |
      | Alimentação   | 200.00  |
    Quando o usuário solicita análise por categoria para maio
    Então a API retorna status 200
    E a resposta contém a categoria com maior despesa "Utilidade"
    E a resposta contém percentual de distribuição de cada categoria

  Cenário: Gerar previsão de gastos anuais
    Dado um usuário autenticado com id 1
    E o usuário possui contas recorrentes mensais:
      | nome       | valor | frequência |
      | Água       | 100   | Mensal     |
      | Luz        | 150   | Mensal     |
      | Alimento   | 200   | Semanal    |
      | Internet   | 89.90 | Mensal     |
    Quando o usuário solicita previsão anual de gastos
    Então a API retorna status 200
    E a resposta contém previsãoAnual maior que 0
    E a resposta contém:
      | campo              | valor      |
      | previsãoMensal     | 1346.20    |
      | previsãoAnual      | 16154.40   |
      | dataCalculoGerado  | timestamp  |

  Cenário: Alertar sobre variação significativa de gastos
    Dado um usuário autenticado com id 1
    E a média mensal de gastos do usuário é 400.00
    E o usuário gastou 600.00 em maio (variação de 50%)
    Quando o usuário solicita relatório de maio
    Então a API retorna status 200
    E a resposta inclui alerta de variação significativa
    E o alerta contém mensagem "Seus gastos aumentaram 50% em relação à média"

  Cenário: Exportar relatório em PDF
    Dado um usuário autenticado com id 1
    E o usuário possui dados financeiros do período maio de 2026
    Quando o usuário solicita exportar relatório em PDF
    Então a API retorna status 200
    E a resposta contém arquivo PDF válido
    E o arquivo contém:
      | seção              |
      | Resumo do período  |
      | Despesas totais    |
      | Análise por categoria |
      | Gráficos           |
      | Data de geração    |

  Cenário: Filtrar relatório por categoria específica
    Dado um usuário autenticado com id 1
    E o usuário possui despesas em várias categorias em maio
    Quando o usuário solicita relatório apenas da categoria "Alimentação"
    Então a API retorna status 200
    E a resposta contém apenas despesas da categoria solicitada
    E a resposta inclui:
      | campo                    | tipo     |
      | totalCategoriaDoMês      | decimal  |
      | quantidadeDespesas       | integer  |
      | percentualDoGastoTotal    | decimal  |

  Cenário: Listar despesas pendentes vs realizadas
    Dado um usuário autenticado com id 1
    E o usuário possui contas para maio:
      | status  | quantidade | valor  |
      | Pagas   | 3          | 300.00 |
      | Pendentes | 2        | 180.00 |
    Quando o usuário solicita resumo de status das contas
    Então a API retorna status 200
    E a resposta contém:
      | campo                | valor  |
      | totalPago            | 300.00 |
      | totalPendente        | 180.00 |
      | percentualPago       | 62.5%  |
      | percentualPendente   | 37.5%  |
