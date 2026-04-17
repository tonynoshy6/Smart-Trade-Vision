# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 with vision)

## Authentication

- **Provider**: Clerk Auth (Google OAuth + Email)
- Google sign-in/sign-up fully integrated via Clerk
- Old username/password system replaced
- Sign-in: `/sign-in`, Sign-up: `/sign-up`
- Clerk proxy middleware mounted on `/api-server`

## Application: محلل التداول الذكي (Smart Trading Analyzer)

A professional Arabic AI-powered trading analysis platform.

### Features
- Fully Arabic RTL interface (Cairo font, dark black + gold theme)
- Upload chart images (PNG/JPG) for AI analysis
- AI analyzes using SMC, ICT, Support & Resistance concepts
- Returns: trade type, entry, stop loss, take profit, probability, risk/reward
- Identifies: liquidity zones, order blocks, FVGs, BOS, ChoCH events
- Analysis history with stats dashboard
- Copy Trade button
- Market selector (Forex, Gold, Crypto) and timeframe selector

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server (port 8080, /api)
│   └── trading-analyzer/   # React + Vite Arabic trading UI (port auto, /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server integration
│   └── integrations-openai-ai-react/   # OpenAI React integration
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `analyses` table: stores all chart analysis results including all SMC/ICT zones

## API Endpoints

- `GET /api/healthz` — Health check
- `POST /api/analysis/analyze` — Analyze chart image with OpenAI vision
- `GET /api/analysis/history` — Get analysis history
- `GET /api/analysis/history/:id` — Get single analysis
- `DELETE /api/analysis/history/:id` — Delete analysis
- `GET /api/analysis/stats` — Get aggregate statistics

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/trading-analyzer` (`@workspace/trading-analyzer`)

React + Vite Arabic trading platform frontend. RTL layout, dark theme with gold accents.

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes in `src/routes/`. Uses OpenAI vision API for chart analysis.

- Body size limit: 20MB (for base64 image uploads)
- Depends on: `@workspace/db`, `@workspace/api-zod`, `@workspace/integrations-openai-ai-server`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `src/schema/analyses.ts` — analyses table

Production migrations are handled by Replit when publishing. In development: `pnpm --filter @workspace/db run push`.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec + Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
