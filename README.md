# FinancialHero - Backend

## Sobre o projeto

O **FinancialHero** é um sistema web voltado para **organização financeira pessoal**.

A aplicação permite que usuários registrem gastos, armazenem comprovantes e acompanhem informações relacionadas às suas finanças de forma simples e organizada.

Este repositório contém a parte responsável pela **lógica da aplicação, processamento das requisições e gerenciamento dos dados do sistema**.

---
## Frontend

O frontend da aplicação está disponível em:

[FinancialHero Frontend ](https://github.com/GustavoSilles/financialhero-frontend)

---
## Gestão de Configuração

### Workflow de Branches (Git Flow)

O projeto utiliza o modelo Git Flow, de forma simples:

- `main` → versão principal (produção)  
- `feature/nome-da-tarefa` → desenvolvimento de novas funcionalidades  

#### Como trabalhar:

1. Criar uma branch a partir da `main`  
2. Desenvolver a funcionalidade  
3. Fazer commits seguindo o padrão  
4. Abrir um Pull Request (PR)  
5. Outro integrante revisa  
6. Após aprovação, realizar merge na `main`  

---

### Padrão de Commits (Conventional Commits)

Todos os commits devem seguir este padrão:


tipo: descrição curta


#### Tipos mais usados:

- `feat:` nova funcionalidade  
- `fix:` correção de bug  
- `docs:` documentação  
- `test:` testes  
- `refactor:` melhoria de código sem alterar comportamento  

#### Exemplos:


fix: corrigir erro no login


#### Não permitido:


corrigindo coisas

## Autores

- Djeferson Luiz Kuhn Almeida  
- Gabriel Da Fonseca Meira  
- Gustavo Drohobeczky Silles  
- Kauany Pecuch Ramos  

Projeto desenvolvido para fins acadêmicos.
