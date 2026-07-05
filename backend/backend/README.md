# FoodERP Backend

Node.js + Express + TypeScript backend for the FoodERP project.

## Sprint 1 — Authentication Foundation (current state)

Implements a single mock endpoint:

```
POST /v1/auth/login
```

No database access, password verification, or JWT signing yet — all isolated
inside `src/modules/auth/auth.service.ts` for a clean swap-in in a later sprint.

## Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts
│   ├── middlewares/
│   │   └── errorHandler.ts
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.types.ts
│   │       ├── auth.service.ts
│   │       ├── auth.controller.ts
│   │       └── auth.routes.ts
│   ├── routes/
│   │   └── index.ts
│   ├── app.ts
│   └── server.ts
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

## Installation

```bash
cd backend
npm install
cp .env.example .env
```

## Run (development, hot-reload)

```bash
npm run dev
```

## Build & Run (production)

```bash
npm run build
npm start
```

## Test the endpoint

```bash
curl -X POST http://localhost:4000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

Expected response:

```json
{
  "access_token": "mock_access_token",
  "refresh_token": "mock_refresh_token",
  "expires_in": 1800,
  "role_ids": [2, 5]
}
```
