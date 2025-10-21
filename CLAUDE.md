# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fidudoc is an intelligent document operations platform for European professional services (fiduciaries, accountants, fund administrators). It provides infrastructure for document storage → validation → intelligence → search, helping firms process hundreds of documents monthly with automated classification, compliance validation, and entity relationship tracking.

The platform is organized into layers:
- **Storage**: Unified, compliant document repository
- **Inspector**: Automated extraction and validation via specialized APIs + LLM gap-filling
- **Intelligence**: Connects entities, contracts, and obligations into a queryable graph
- **Discoverability**: Natural-language and structured search grounded in source documents

## Repository Structure

This is a pnpm monorepo with four packages:

- `packages/storage/` - Storage service (Express + Effect backend)
- `packages/inspector/` - Inspector workflows (Trigger.dev tasks for document processing)
- `packages/domain/` - Domain entities and shared types
- `packages/app/` - Web application (not yet implemented)

## Development Commands

### Running the Application

```bash
# Start storage service in development mode with hot reload
pnpm dev

# Start storage service (same as above)
pnpm --filter @fidudoc/storage dev

# Start storage service in production mode
pnpm --filter @fidudoc/storage start
```

### Trigger.dev Workflows (Inspector)

```bash
# Run Trigger.dev development server for inspector workflows
pnpm exec trigger@latest dev

# Deploy inspector workflows to Trigger.dev
pnpm exec trigger@latest deploy
```

### Building

```bash
# Build all packages
pnpm build

# Build storage package only
pnpm --filter @fidudoc/storage build
```

### Code Quality

```bash
# Lint and format check (full check)
pnpm check

# Fix linting and formatting issues
pnpm check:fix

# Lint only (Biome)
pnpm lint

# Fix lint issues
pnpm lint:fix

# Format check only (dprint)
pnpm format:check

# Format code
pnpm format

# Type checking
pnpm typecheck
```

### Package Management

```bash
# Clean all build artifacts
pnpm clean

# Install dependencies
pnpm install
```

## Technology Stack

### Core Technologies (Storage Component)

- **Runtime**: Node.js 23+ (LTS)
- **Web Framework**: Express
- **Business Logic**: Effect (TypeScript) - for structured domain logic, typed services, controlled side effects, and consistent error handling
- **Schema & Validation**: effect/Schema - input/output validation, API contracts, type generation
- **Authentication**: Supabase Auth (JWT-based)
- **Authorization**: Casbin (policy-based RBAC with multi-tenant domain scoping)
- **Object Storage**: Supabase Storage
- **Database**: Supabase Postgres (metadata, audit trails)
- **Monitoring**: Sentry (error tracking, tracing, performance metrics)
- **Background Workflows**: Trigger.dev v3 (document processing tasks in Inspector component)

### Tooling

- **Package Manager**: pnpm (v10.13.1)
- **Linter**: Biome
- **Formatter**: dprint (TypeScript line width: 86)
- **TypeScript**: v5.9.3, targeting ES2022, ESNext modules, Bundler resolution

## Architecture Principles

### Separation of Concerns
- **Express**: HTTP routing and middleware
- **Effect**: Domain logic and business rules
- **Casbin**: Authorization policies

### Type Safety
- effect/Schema ensures strong runtime and compile-time guarantees
- All API contracts defined with schemas for validation

### Multi-Tenancy
- Authorization and storage operations scoped by tenant domain
- Secure isolation between clients

### Observability
- Sentry instrumentation loaded via `instruments.mjs` using `--import` flag
- Environment variables: `SENTRY_DSN_BACKEND`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`
- Logging middleware captures request/response details

### Configuration
- Environment variables loaded via `.env` (not committed)
- Server defaults: `PORT=3000`, `HOST=localhost`

## File Organization

```
packages/storage/
├── src/
│   ├── index.ts              # Entry point, Express server setup
│   └── middleware/
│       └── logging.ts        # Request/response logging
├── instruments.mjs           # Sentry initialization
├── knowledge/
│   └── use-cases.md         # MVP use cases and API specification
└── README.md                # Tech stack summary

packages/inspector/
└── example.ts               # Example Trigger.dev task (hello-world)

trigger.config.ts            # Trigger.dev configuration
                             # - Project: proj_nsgmszzijyetcjhzhret
                             # - Runtime: node
                             # - Max duration: 3600s (1 hour)
                             # - Retries: 3 attempts with exponential backoff
                             # - Task directory: packages/inspector
```

## Development Workflow

### Storage Component
1. Use Effect for business logic - avoid putting domain logic directly in Express handlers
2. All API inputs/outputs should be validated using effect/Schema
3. Authorization checks should use Casbin policies (not yet implemented)
4. Sentry is automatically initialized via NODE_OPTIONS in dev/start scripts
5. Logging middleware captures full request/response cycle for debugging

### Inspector Component (Trigger.dev)
1. All document processing workflows are defined as Trigger.dev tasks in `packages/inspector/`
2. Tasks use the Trigger.dev v3 SDK (`@trigger.dev/sdk/v3`)
3. Each task should define:
   - Unique `id` for identification
   - `maxDuration` to prevent runaway tasks (defaults to 3600s from config)
   - `run` function with typed payload and context
4. Use `logger` from Trigger.dev SDK for structured logging
5. Use `wait.for()` for delays/polling instead of setTimeout
6. Tasks are automatically discovered from the `packages/inspector/` directory
7. Run `pnpm exec trigger@latest dev` to test workflows locally before deployment

## Use Cases Reference

The Storage API is designed around these key workflows (see `packages/storage/knowledge/use-cases.md`):

- **Administrator**: System configuration via JSON, user management
- **Operator**: Daily inbox processing, exception handling, client document registry, entity resolution
- **System**: Document intake (email/portal/chat), validation workflows, auto-approval flows

API endpoints follow REST conventions with document-centric operations.
