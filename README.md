# fullstack-app-2026-m

Aplicação fullstack do tema **Petshop** com:

- backend em **Node.js + Express**
- frontend em **HTML, CSS e JavaScript**
- banco **PostgreSQL**
- autenticação **JWT**
- documentação **Swagger**
- stack completa em **Docker Compose**

## O que o projeto entrega

- Cadastro e login de usuários com JWT
- CRUD protegido para:
  - Tutores
  - Pets
  - Serviços
  - Produtos
  - Agendamentos
- Interface web simples e responsiva consumindo a API
- Documentação Swagger em `http://localhost:3000/api/docs`

## Como executar com Docker

```bash
cp .env.example .env
# edite o arquivo .env e defina valores fortes para DB_PASSWORD e JWT_SECRET
docker compose up --build
```

Serviços disponíveis:

- Frontend: `http://localhost:8080`
- Backend: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/api/docs`
- PostgreSQL: `localhost:5432`

## Como executar o backend localmente

```bash
cd backend
npm install
npm start
```

Variáveis aceitas pelo backend:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`

> Para usar Docker Compose, crie um arquivo `.env` na raiz com base no `.env.example`.

## Fluxo sugerido para demonstrar

1. Abra o frontend em `http://localhost:8080`
2. Cadastre um usuário
3. Faça login
4. Cadastre um tutor
5. Cadastre pets, serviços, produtos e agendamentos
6. Consulte a documentação no Swagger
