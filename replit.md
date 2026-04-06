# Klaro - AI-powered Business Management Platform

## Overview

Klaro is a full-stack web application that lets small business owners upload business data (bank statements, spreadsheets, photos), have AI extract and structure the data, review/edit the extracted records, and see dashboards + insights.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite + TypeScript (artifacts/klaro)
- **Styling**: Tailwind CSS (dark theme: black / dark gray / neon green)
- **Routing**: Wouter
- **Data fetching**: TanStack React Query (generated hooks)
- **Backend**: Express 5 + TypeScript (artifacts/api-server)
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Auth**: Session-based (express-session + connect-pg-simple + PostgreSQL sessions table)
- **File storage**: Local filesystem abstraction (artifacts/api-server/src/lib/storage.ts)
- **API contract**: OpenAPI 3.1 + Orval codegen
- **Validation**: Zod (via drizzle-zod and orval)
- **Build**: esbuild (CJS bundle for server)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/klaro run dev` — run frontend locally

## Folder Structure

```
artifacts/
  api-server/src/
    routes/      # auth, uploads, parsed-records, transactions, insights, dashboard
    lib/         # storage.ts (S3-swappable), parser.ts (CSV/XLSX/PDF/image), insights-engine.ts
    middlewares/ # auth.ts (requireAuth session middleware)
  klaro/src/
    pages/       # Landing, Login, Signup, Dashboard, Upload, Review, Transactions, Insights
    components/  # Layout, Sidebar, shared UI components
    hooks/       # use-auth and other custom hooks
lib/
  api-spec/      # openapi.yaml — single source of truth for all API contracts
  api-client-react/src/generated/  # React Query hooks (generated, do not edit)
  api-zod/src/generated/           # Zod schemas (generated, do not edit)
  db/src/schema/ # Drizzle ORM table definitions: users, raw_inputs, parsed_records, transactions, insights
```

## Database Tables

- `users` — user accounts (id, name, email, password_hash, created_at)
- `raw_inputs` — uploaded files with processing status
- `parsed_records` — extracted records pending user review
- `transactions` — confirmed business transactions
- `insights` — generated business insights
- `user_sessions` — express-session storage (auto-created)

## Architecture Notes

- **Storage abstraction**: `artifacts/api-server/src/lib/storage.ts` — swap for S3 by implementing `saveFile` and `deleteFile` using AWS SDK
- **Parser abstraction**: `artifacts/api-server/src/lib/parser.ts` — replace mock functions with real OCR/LLM for production
- **Insights engine**: `artifacts/api-server/src/lib/insights-engine.ts` — rule-based now, replace with LLM for richer analysis
- **Auth**: session-based with PostgreSQL store. Easily migrated to JWT/OAuth by changing auth routes and removing express-session

## Demo User

- Email: demo@klaro.app
- Password: demo1234

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
