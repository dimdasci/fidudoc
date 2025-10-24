# Fidudoc Web Application

Front-end for the Fidudoc intelligent document platform. The app delivers a multi-panel workspace for European fiduciary and accounting teams to triage, validate, and enrich high-volume document flows with realtime status tracking.

## Overview

The application glues together document ingestion, storage, validation, and knowledge graph services. It surfaces document state, entity relationships, and operational insights while keeping UX fast, accessible, and ready for production hardening.

👉 For the full breakdown of feature slices, shared layers, and architectural guidelines, read [ARCHITECTURE.md](./knowledge/ARCHITECTURE.md).

## Technology Stack

### Framework & Routing

- **React 19** with concurrent rendering
- **React Router v7** for route-based code splitting
- **Vite 5.4** development & build tooling
- **TypeScript 5.9** with `strict` mode

### Data & Domain

- **TanStack Query v5** for server state caching
- **Zustand v4.5** for app/UI stores
- **Effect** & **@effect/schema** for typed services and runtime validation

### Internationalization

- **i18nano-style store** backed by Zustand (`src/i18n/i18n.ts`)
- JSON message catalogs per locale (`src/i18n/locales/*.json`)
- Lazy loading, browser locale detection, and persisted language preference
- `useI18nContext()` hook exposes `t`, `locale`, `setLocale`

### UI & Experience

- **react-resizable-panels** powers a flexible, resizable workspace
- Default layout ships with navigation, content, and details panels, but panels can be hidden or repurposed per view
- Inline styles with shared design tokens for fast iteration
- Toast notifications and other primitives live in `src/ui/primitives.tsx`

### Tooling

- **pnpm 10.13.1+**
- **Node.js 23+**
- **Biome** for linting
- **dprint** for formatting

## Repository Layout

```
packages/app/
├── src/
│   ├── app/                  # Vite entry points, router, providers
│   ├── features/             # Feature-first slices (Inbox, Users, Audit, Settings)
│   │   └── <feature>/
│   │       ├── api/          # Feature-scoped fetchers & contracts
│   │       ├── components/   # View components composed by the route
│   │       ├── hooks/        # TanStack Query hooks + local state
│   │       ├── i18n/         # Feature-specific message bundles
│   │       └── routes/       # Public route entry points
│   ├── i18n/                 # Shared i18n store + base locale strings
│   ├── services/             # Cross-feature service clients
│   ├── stores/               # Global Zustand stores
│   ├── ui/                   # Design-system primitives & layout
│   ├── index.css
│   └── main.tsx
├── ARCHITECTURE.md           # Expanded structure & conventions
├── index.html
├── vite.config.ts
├── tsconfig.json
├── biome.json
└── package.json
```

> The tree above is high level—see [ARCHITECTURE.md](./knowledge/ARCHITECTURE.md) for detailed notes on dependencies, naming, and “feature-first” rules.

## Getting Started

### Prerequisites

- Node.js **23+**
- pnpm **10.13.1+**

### Install Dependencies

```bash
# From the monorepo root
pnpm install

# (Optional) focus install for this package
pnpm --filter @fidudoc/app install
```

### Development Workflow

```bash
# Start Vite dev server with HMR
pnpm dev

# Or scoped to this package
pnpm --filter @fidudoc/app dev
```

Visit `http://localhost:5173`.

```bash
# Type checking
pnpm typecheck

# Lint and format checks
pnpm lint
pnpm format:check

# One-shot quality gate
pnpm check
```

### Production Build

```bash
pnpm build
pnpm preview
```

## Internationalization Guide

- Shared/base strings live in `src/i18n/locales/<locale>.json`.
- Feature-specific strings live next to the code that consumes them (`src/features/<feature>/i18n/<locale>.json`). The i18n store auto-loads everything via `import.meta.glob`.
- Add new languages by updating `SUPPORTED_LOCALES` in `src/i18n/i18n.ts` and creating matching base + feature locale files.
- `initializeI18n()` runs before render to load the preferred locale from localStorage or the browser.
- Use `const { t } = useI18nContext();` and call `t("key.path", { placeholder: value })`.

## Panel Workspace

`src/ui/AppShell.tsx` wires the resizable panel system:

- Navigation, content, and details panels are defaults, not requirements.
- Feature modules can resize or hide panels depending on the view.
- Panel state is kept minimal so the layout feels responsive across devices.

## Data & Services

- `services/api.ts` wraps browser `fetch` for document-related endpoints and centralizes shapes for `Document`, `User`, `AuditLog`, and `Settings`.
- `services/client.ts` is the bridge for integrating Effect-based clients (incoming).
- Global API health indicator lives in `stores/api.ts` and is surfaced in the `AppShell` footer.
- UI-specific selections are stored in `stores/ui.ts`.

## Troubleshooting

- **Dev server fails to start** → Kill stray Vite processes (`pkill -f "vite"`) and rerun `pnpm dev`.
- **Type errors in IDE** → `pnpm typecheck` then restart the TypeScript/IDE server.
- **Translations missing** → Confirm the key exists in the current locale JSON. Clear `localStorage.language` and reload.
- **Stale HMR updates** → Restart the dev server and hard-refresh the browser cache.

## License

Copyright (c) Fidudoc. All rights reserved.
