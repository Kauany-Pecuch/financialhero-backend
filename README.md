# FinancialHero - Backend

## Sobre o projeto

O **FinancialHero** é um sistema web voltado para **organização financeira pessoal**.

A aplicação permite que usuários registrem gastos, armazenem comprovantes e acompanhem informações relacionadas às suas finanças de forma simples e organizada.

Este repositório contém a parte responsável pela **lógica da aplicação, processamento das requisições e gerenciamento dos dados do sistema**.

---

## Frontend

O frontend da aplicação está disponível em:

[FinancialHero Frontend ](https://github.com/GabrielFMeira/financialhero-frontend)

---

# Estrutura do Projeto

```text
financialhero-backend/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── repository/
│   ├── models/
│   ├── routers/
│   ├── middlewares/
│   ├── schemas/
│   ├── types/
│   ├── shared/
│   ├── config/
│   ├── errors/
│   ├── db.ts
│   └── server.ts
│
├── tests/
│   └── unit/
│
├── templates/
├── features/
├── .env.example
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

# Arquitetura

O projeto utiliza arquitetura MVC com separação em camadas:

```text
Controllers → Services → Repository → Models → Database
```

## Responsabilidade das Camadas

| Camada | Responsabilidade |
|---|---|
| Controllers | Recebem e tratam requisições HTTP |
| Services | Contêm a lógica de negócio |
| Repository | Acessam o banco de dados |
| Models | Definem entidades Sequelize |
| Middlewares | Autenticação, validação e tratamento de erros |
| Schemas | Validação de dados com Zod |
| Shared | Utilitários e providers compartilhados |

---

# Fluxo de Requisição

```text
Request HTTP
   ↓
Router
   ↓
Middlewares
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
Database
   ↓
Response JSON
```

## Exemplo

```text
POST /bills/:id/pay
        ↓
BillRouter
        ↓
Auth Middleware
        ↓
BillController.payBill()
        ↓
BillService.payBill()
        ↓
BillRepository.update()
        ↓
Response 200
```

---

# Tecnologias Utilizadas

## Backend

- Express.js
- TypeScript
- Sequelize
- PostgreSQL

## Segurança e Autenticação

- JWT
- bcrypt
- CORS

## Validação e Logging

- Zod
- Pino

## Upload e Comunicação

- Multer
- Nodemailer

## Testes

- Vitest
- Supertest
- Testcontainers

---

# Pré-requisitos

Antes de iniciar o projeto, certifique-se de possuir:

- Node.js v18+
- npm v10+
- PostgreSQL v13+
- Git

---

# Configuração do Ambiente

## 1. Clonar o Repositório

```bash
git clone https://github.com/Kauany-Pecuch/financialhero-backend.git
cd financialhero-backend
```

## 2. Instalar Dependências

```bash
npm install
```

## 3. Configurar Banco de Dados

```bash
createdb financialhero
```

Certifique-se de que o PostgreSQL esteja em execução.

## 4. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example`:

```bash
cp .env.example .env
```

---

# Como Rodar o Projeto

## Ambiente de Desenvolvimento

```bash
npm run dev
```

Servidor disponível em:

```text
http://localhost:3000
```

## Build de Produção

```bash
npm run build
```

Os arquivos compilados serão gerados em:

```text
dist/
```

---

# Scripts Disponíveis

| Script | Descrição |
|---|---|
| `npm run dev` | Executa em desenvolvimento |
| `npm run build` | Compila TypeScript |
| `npm run clean` | Remove a pasta dist |
| `npm test` | Executa todos os testes |
| `npm run test:unit` | Executa testes unitários |

---

# Autenticação

O sistema utiliza autenticação baseada em JWT.

## Fluxo de Login

1. Usuário envia email e senha
2. Credenciais são validadas
3. Senha é comparada com hash bcrypt
4. JWT é gerado
5. Token é retornado ao cliente
6. Cliente utiliza o token nas próximas requisições

## Header de Autenticação

```http
Authorization: Bearer <token>
```

---

# Testes

## Executar Todos os Testes

```bash
npm test
```

## Executar Apenas Testes Unitários

```bash
npm run test:unit
```

## Cobertura de Testes

- BillService
- FileUploadService
- MetricsService
- PasswordService
- UserService
- Shared utilities

---

# Gestão de Configuração

## Workflow de Branches

O projeto utiliza uma estratégia simples baseada em Git Flow:

| Branch | Objetivo |
|---|---|
| `main` | Produção |
| `feature/nome-feature` | Desenvolvimento de funcionalidades |

## Fluxo de Trabalho

1. Criar branch a partir da `main`
2. Desenvolver funcionalidade
3. Realizar commits
4. Abrir Pull Request
5. Revisão de código
6. Merge na `main`
7. Remover branch

---

# Conventional Commits

Todos os commits devem seguir o padrão:

```text
tipo: descrição
```

## Tipos Utilizados

| Tipo | Descrição |
|---|---|
| feat | Nova funcionalidade |
| fix | Correção de bugs |
| refactor | Refatoração |
| docs | Documentação |
| test | Testes |
| style | Formatação |
| chore | Tarefas gerais |

## Exemplos

```text
feat: adicionar autenticação JWT
fix: corrigir cálculo de métricas
docs: atualizar README
refactor: otimizar consulta de contas
```

---

# Endpoints Principais

## Autenticação

| Método | Endpoint |
|---|---|
| POST | `/auth/login` |
| POST | `/auth/register` |
| POST | `/auth/forgot-password` |

## Usuários

| Método | Endpoint |
|---|---|
| GET | `/users/:id` |
| PUT | `/users/:id` |
| DELETE | `/users/:id` |

## Contas

| Método | Endpoint |
|---|---|
| GET | `/bills` |
| POST | `/bills` |
| PUT | `/bills/:id` |
| DELETE | `/bills/:id` |
| POST | `/bills/:id/pay` |

## Uploads

| Método | Endpoint |
|---|---|
| POST | `/uploads` |
| GET | `/uploads/:id` |

## Métricas

| Método | Endpoint |
|---|---|
| GET | `/metrics/summary` |
| GET | `/metrics/trends` |

---

# Autores

- Djeferson Luiz Kuhn Almeida
- Gabriel Da Fonseca Meira
- Gustavo Drohobeczky Silles
- Kauany Pecuch Ramos

Projeto desenvolvido para fins acadêmicos.