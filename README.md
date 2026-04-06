# Klaro

**AI-powered business management platform for small and medium businesses.**

> "Transforme dados bagunçados em gestão clara"

Klaro lets business owners upload bank statements, spreadsheets, or photos of notes, then automatically extracts and structures the data, lets users review and confirm it, and shows dashboards with business metrics and actionable insights.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS (dark theme: black / dark gray / neon green) |
| Routing | Wouter |
| Data fetching | TanStack React Query (generated hooks) |
| Backend | Express 5 + TypeScript |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Auth | Session-based (express-session + connect-pg-simple) |
| File storage | Local filesystem abstraction (swap for S3 later) |
| API contract | OpenAPI 3.1 + Orval codegen |

---

## Project Structure

```
/
├── artifacts/
│   ├── api-server/          # Express backend
│   │   ├── src/
│   │   │   ├── routes/      # auth, uploads, parsed-records, transactions, insights, dashboard
│   │   │   ├── lib/         # storage.ts, parser.ts, insights-engine.ts
│   │   │   └── middlewares/ # auth.ts (requireAuth)
│   │   └── ...
│   └── klaro/               # React + Vite frontend
│       └── src/
│           ├── pages/       # Landing, Login, Signup, Dashboard, Upload, Review, Transactions, Insights
│           ├── components/  # Layout, Sidebar, shared UI
│           └── hooks/       # use-auth, etc.
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 spec (single source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod validation schemas
│   └── db/                  # Drizzle ORM schema + client
└── ...
```

---

## Setup

### Prerequisites

- Node.js 24+
- pnpm
- PostgreSQL database

### Environment Variables

Copy the example and fill in:

```bash
DATABASE_URL=postgresql://...
SESSION_SECRET=your-long-random-secret
```

### Install & Run

```bash
# Install all workspace dependencies
pnpm install

# Push DB schema
pnpm --filter @workspace/db run push

# Run API server
pnpm --filter @workspace/api-server run dev

# Run frontend (in another terminal)
pnpm --filter @workspace/klaro run dev
```

### Codegen (after changing OpenAPI spec)

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Features

### Authentication
- Email + password signup and login
- Session-based auth (PostgreSQL-backed sessions)
- Protected routes redirect unauthenticated users to login

### Upload Flow
Supports: **CSV**, **XLSX**, **PDF**, **Images (PNG, JPG)**

The parsing pipeline is abstracted in `artifacts/api-server/src/lib/parser.ts`:
- **CSV**: real column-aware parser with Brazilian date format support
- **XLSX**: mock extraction (TODO: integrate real xlsx library)
- **PDF**: stub + text extraction (TODO: integrate pdf-parse)
- **Images**: stored for future OCR (TODO: integrate Tesseract/Google Vision)

### Review & Confirm
After upload, extracted records appear in an editable table:
- Edit any field inline
- Delete rows
- Add new rows manually
- Confirm all — saves final Transaction records

### Dashboard
- Total income, expenses, net balance
- Transaction count and upload count
- Monthly income vs expenses chart (Recharts)
- Category breakdown chart

### Insights Engine
Rule-based insight generation in `artifacts/api-server/src/lib/insights-engine.ts`:
- Net balance health check
- Income trend between months
- Expense concentration by category
- Low ticket size detection
- Peak activity month detection

> **TODO**: Replace with LLM-based insight generation for richer analysis.

---

## Future Roadmap

- [ ] Real OCR for image files (Tesseract.js or Google Vision API)
- [ ] LLM-based extraction / classification (GPT-4o with structured output)
- [ ] Real XLSX parsing (xlsx library)
- [ ] Real PDF text extraction (pdf-parse)
- [ ] S3-compatible file storage (swap `lib/storage.ts`)
- [ ] LLM-based insights (replace `insights-engine.ts`)
- [ ] Export reports as PDF/Excel
- [ ] Multi-user team accounts
- [ ] Improved categorization with ML
- [ ] Richer dashboards with drill-down

---

## Demo

A demo user is seeded on first setup:
- **Email**: `demo@klaro.app`
- **Password**: `demo1234`
