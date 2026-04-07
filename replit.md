# Klaro - AI-powered Business Management Platform

## Overview

Klaro is a full-stack business management platform for small/medium Brazilian businesses. Users upload financial data (CSV, XLSX, PDF, images), the system extracts and structures the data, users review/confirm records, and the app shows dashboards with business metrics and actionable insights. Available as both a web app and a React Native mobile app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Web frontend**: React + Vite + TypeScript (artifacts/klaro)
- **Mobile app**: React Native + Expo (artifacts/klaro-mobile)
- **Styling**: Tailwind CSS web / React Native StyleSheet mobile (dark theme: black / dark gray / neon green #39FF14)
- **Routing**: Wouter (web) / Expo Router (mobile)
- **Data fetching**: TanStack React Query (generated hooks, shared via @workspace/api-client-react)
- **Backend**: Express 5 + TypeScript (artifacts/api-server)
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Auth**: Session-based for web (express-session + connect-pg-simple) / JWT Bearer tokens for mobile (jsonwebtoken)
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
    routes/      # auth (+ JWT token endpoints), uploads, parsed-records, transactions, insights, dashboard
    lib/         # storage.ts (S3-swappable), parser.ts (CSV/XLSX/PDF/image), insights-engine.ts
    middlewares/ # auth.ts (requireAuth: accepts session OR Bearer JWT)
  klaro/src/
    pages/       # Landing, Login, Signup, Dashboard, Upload, Review, Transactions, Insights
    components/  # Layout, Sidebar, shared UI components
    hooks/       # use-auth and other custom hooks
  klaro-mobile/
    app/
      (auth)/    # login.tsx, signup.tsx (JWT auth, no cookies)
      (tabs)/    # index.tsx (Dashboard), transactions.tsx, upload.tsx, insights.tsx
      review/    # [id].tsx (parsed records review + confirm)
      index.tsx  # auth gate redirect
    contexts/    # AuthContext.tsx (JWT stored in AsyncStorage)
    constants/   # colors.ts (neon green #39FF14, black bg, dark gray cards)
    components/  # KlaroButton, KlaroInput, MetricCard, TransactionRow
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
