Funcionalidade: Gerenciamento de Perfil de Usuário

  Cenário: Atualizar informações básicas do perfil
    Dado um usuário autenticado com id 1
    E o usuário possui os dados:
      | campo | valor                    |
      | nome  | João Silva               |
      | email | joao@example.com         |
      | cpf   | 123.456.789-10           |
    Quando o usuário atualiza seu perfil com:
      | campo | valor                    |
      | nome  | João Silva Santos        |
      | email | joao.santos@example.com  |
    Então a API retorna status 200
    E os dados do usuário são atualizados com sucesso
    E a resposta contém o novo nome "João Silva Santos"

  Cenário: Validar email duplicado ao atualizar perfil
    Dado um usuário autenticado com id 1
    E um usuário com id 2 possui o email "maria@example.com"
    Quando o usuário id 1 tenta atualizar seu email para "maria@example.com"
    Então a API retorna status 409
    E a resposta contém mensagem de erro "Email já cadastrado"

  Cenário: Atualizar senha com sucesso
    Dado um usuário autenticado com id 1
    E o usuário possui a senha "SenhaAntiga123!"
    Quando o usuário atualiza sua senha com:
      | campo              | valor            |
      | senhaAtual         | SenhaAntiga123!  |
      | novaSenha          | NovaSenha456!    |
      | confirmaSenha      | NovaSenha456!    |
    Então a API retorna status 200
    E a senha do usuário é alterada com sucesso
    E a resposta contém mensagem "Senha atualizada com sucesso"

  Cenário: Rejeitar mudança de senha com senha atual incorreta
    Dado um usuário autenticado com id 1
    Quando o usuário tenta atualizar sua senha com:
      | campo              | valor            |
      | senhaAtual         | SenhaErrada123!  |
      | novaSenha          | NovaSenha456!    |
      | confirmaSenha      | NovaSenha456!    |
    Então a API retorna status 401
    E a resposta contém mensagem de erro "Senha atual inválida"

  Cenário: Validar senhas diferentes na confirmação
    Dado um usuário autenticado com id 1
    Quando o usuário tenta atualizar sua senha com:
      | campo              | valor            |
      | senhaAtual         | SenhaAntiga123!  |
      | novaSenha          | NovaSenha456!    |
      | confirmaSenha      | OutraSenha789!   |
    Então a API retorna status 400
    E a resposta contém mensagem de erro "Senhas não conferem"

  Cenário: Buscar informações completas do perfil
    Dado um usuário autenticado com id 1
    E o usuário possui os dados:
      | campo          | valor                |
      | nome           | Maria Silva          |
      | email          | maria@example.com    |
      | cpf            | 987.654.321-00       |
      | telefone       | 11987654321          |
      | dataCriacao    | 2026-01-15           |
    Quando o usuário solicita seus dados de perfil
    Então a API retorna status 200
    E a resposta contém todos os dados do usuário
    E a resposta não inclui a senha do usuário
