# Exercise Tracker

Este repositório contém o boilerplate para o projeto **Exercise Tracker**. O objetivo deste projeto é criar uma aplicação que permite aos usuários criar contas, registrar exercícios e visualizar logs de exercícios.

## Descrição

A aplicação permite aos usuários:
- Criar um novo usuário.
- Adicionar exercícios para um determinado usuário, incluindo descrição, duração e data.
- Visualizar um log de exercícios com filtro opcional de data e limite de registros.

## Tecnologias Utilizadas

- **Node.js**: Plataforma de desenvolvimento JavaScript para o backend.
- **Express**: Framework web para Node.js.
- **MongoDB**: Banco de dados NoSQL utilizado para armazenar os usuários e exercícios.
- **Mongoose**: ODM (Object Data Modeling) para interagir com o MongoDB.
- **HTML/CSS**: Interface frontend básica com um formulário de múltiplas etapas (MultiStep Form).
- **Git**: Controle de versão.

## Funcionalidades

### API Endpoints

1. **Criar um novo usuário:**

   - `POST /api/users`
   - Exemplo de resposta:
     ```json
     {
       "_id": "605c72a11b8f4c23d8db21c8",
       "username": "johndoe"
     }
     ```

2. **Adicionar exercício para um usuário:**

   - `POST /api/users/:_id/exercises`
   - Exemplo de resposta:
     ```json
     {
       "_id": "605c72a11b8f4c23d8db21c8",
       "username": "johndoe",
       "description": "Corrida",
       "duration": 30,
       "date": "Tue Mar 15 2022"
     }
     ```

3. **Obter o log de exercícios de um usuário:**

   - `GET /api/users/:_id/logs?[from][&to][&limit]`
   - Exemplo de resposta:
     ```json
     {
       "_id": "605c72a11b8f4c23d8db21c8",
       "username": "johndoe",
       "count": 2,
       "log": [
         {
           "description": "Corrida",
           "duration": 30,
           "date": "Tue Mar 15 2022"
         },
         {
           "description": "Natação",
           "duration": 45,
           "date": "Thu Mar 17 2022"
         }
       ]
     }
     ```

### Parâmetros opcionais para o log de exercícios:

- `from`: Filtro de data inicial (formato `yyyy-mm-dd`).
- `to`: Filtro de data final (formato `yyyy-mm-dd`).
- `limit`: Limitar o número de registros retornados.

## Como Executar o Projeto Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/samanthasilva/FCC-Exercise-tracker.git
