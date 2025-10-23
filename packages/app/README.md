# Fidudoc Web Application

Front-end for the Fidudoc intelligent document platform. The app delivers a multi-panel workspace for European fiduciary and accounting teams to triage, validate, and enrich high-volume document flows with realtime status tracking.

## Overview

The application glues together document ingestion, storage, validation, and knowledge graph services. It surfaces document state, entity relationships, and operational insights while keeping UX fast, accessible, and ready for production hardening.

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
│   ├── app/
│   │   ├── providers.tsx          # App-level providers (Query, i18n, Router)
│   │   └── router.tsx             # Route configuration
│   ├── features/                  # Route-mounted feature modules
│   │   ├── inbox/routes.tsx
│   │   ├── settings/routes.tsx
│   │   └── admin/routes.tsx
│   ├── i18n/
│   │   ├── i18n.ts                # i18nano store & helpers
│   │   └── locales/
│   │       ├── en.json
│   │       ├── es.json
│   │       ├── fr.json
│   │       └── de.json
│   ├── services/
│   │   ├── api.ts                 # REST client for document APIs
│   │   └── invoices.ts            # Effect-based invoice schema & fetcher
│   ├── stores/
│   │   ├── api.ts                 # Health/status store
│   │   └── ui.ts                  # UI selection state
│   ├── ui/
│   │   ├── AppShell.tsx           # Resizable panel workspace
│   │   ├── LanguageSwitcher.tsx
│   │   └── primitives.tsx
│   ├── index.css                  # Global styles
│   └── main.tsx                   # App entry point
├── index.html
├── vite.config.ts
├── tsconfig.json
├── biome.json
└── package.json
```

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

- Message catalogs live under `src/i18n/locales/<locale>.json`.
- Add new keys directly to the locale JSON files—no compile step is required.
- `initializeI18n()` runs before render to load the preferred locale from localStorage or the browser.
- Use `const { t } = useI18nContext();` in components and call `t("key.path", { placeholder: value })`.
- When introducing a new language, add the locale code to `SUPPORTED_LOCALES` in `src/i18n/i18n.ts` and create a matching JSON file.

## Panel Workspace

`AppShell.tsx` wires the resizable panel system:
- Navigation, content, and details panels are defaults, not requirements.
- Feature modules can resize or hide panels depending on the view.
- Panel state is kept minimal so the layout feels responsive across devices.

## Data & Services

- `services/api.ts` wraps browser `fetch` for document-related endpoints and centralizes shapes for `Document`, `User`, `AuditLog`, and `Settings`.
- `services/invoices.ts` demonstrates using Effect + Schema for typed calls; `run()` helper in `services/client.ts` bridges Effects to Promises.
- Global API health indicator lives in `stores/api.ts` and is surfaced in the `AppShell` footer.
- UI-specific selections are stored in `stores/ui.ts`.

## Troubleshooting

- **Dev server fails to start** → Kill stray Vite processes (`pkill -f "vite"`) and rerun `pnpm dev`.
- **Type errors in IDE** → `pnpm typecheck` then restart the TypeScript/IDE server.
- **Translations missing** → Confirm the key exists in the current locale JSON. Clear `localStorage.language` and reload.
- **Stale HMR updates** → Restart the dev server and hard-refresh the browser cache.

## Roadmap Ideas

1. Flesh out feature routes with real data and forms.
2. Connect `services/api.ts` to live backend endpoints.
3. Expand the UI primitive library and theme tokens.
4. Add component and integration tests (Vitest/Testing Library).

## Contributing Guidelines

- Keep modules cohesive and prefer feature-based structure.
- Add translations for any new UI text.
- Run `pnpm check` before opening a PR.
- Use descriptive commit messages and document notable UX changes in `UX.md` when relevant.

## License

Copyright (c) Fidudoc. All rights reserved.
