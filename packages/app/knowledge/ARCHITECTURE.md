# Fidudoc App Architecture – Feature-First Structure

## Overview

This React application follows a feature-first structure inspired by the storage service. Each business capability (Inbox, Audit, Settings, Users…) owns its route, data access, local UI, and translations. Shared primitives live under `shared/`, while cross-cutting app wiring sits in `app/`. The folder names should communicate the product surface at a glance.

## Target Folder Structure

```
src/
├── app/                          # Application shell, router, providers, global config
│   ├── AppProviders.tsx
│   ├── router.tsx
│   └── config/
│
├── shared/                       # Cross-cutting building blocks
│   ├── ui/                       # Design system primitives (Button, Table, Toast…)
│   │   ├── Button/
│   │   ├── Table/
│   │   ├── Toast/
│   │   └── index.ts
│   ├── lib/                      # Utilities (formatters, HTTP client, React Query helpers)
│   │   ├── format.ts
│   │   ├── http/
│   │   └── react-query/
│   └── translations/             # Translation bootstrap + namespace registration
│       └── index.ts
│
├── features/
│   ├── inbox/                    # Inbox experience (documents triage)
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   └── InboxRoute.tsx    # Route entry composed from hooks + components
│   │   ├── api/
│   │   │   ├── documents.api.ts  # Fetch/command functions scoped to Inbox
│   │   │   ├── documents.types.ts
│   │   │   └── mock.ts           # Optional mocked responses for demos/tests
│   │   ├── hooks/
│   │   │   ├── useDocumentsQuery.ts
│   │   │   └── useInboxSelection.ts
│   │   ├── components/
│   │   │   ├── InboxHeader.tsx
│   │   │   ├── InboxToolbar.tsx
│   │   │   ├── InboxTable.tsx
│   │   │   └── InboxEmptyState.tsx
│   │   ├── lib/
│   │   │   ├── formatDocumentStatus.ts
│   │   │   └── constants.ts
│   │   └── i18n/                 # Feature-scoped translations
│   │       ├── en.json
│   │       ├── es.json
│   │       ├── fr.json
│   │       └── de.json
│   │
│   ├── audit/
│   ├── settings/
│   └── users/                    # User management (renamed from admin)
│
└── pages/                        # Optional: thin route-level compositions, if needed
```

## Implementation Notes

- **Feature encapsulation:** Each feature exports what the rest of the app needs via its `index.ts` (routes, hooks, components). Internal files stay private to that folder.
- **Data boundaries:** Feature `api/` folders wrap raw HTTP calls; the shared layer only exposes infrastructure (e.g., configured fetch, React Query client).
- **UI primitives:** Keep shared components unopinionated (button, table, toast). Feature-specific compositions (e.g., InboxToolbar) stay under that feature.
- **Translations:** Feature namespaces sit beside their code. `shared/translations` wires them into the global i18n store at runtime.
- **Scalability:** Adding a new product area means creating `features/<name>/` with the same subfolders. Consistent naming keeps imports predictable and prevents route files from ballooning.

Start migrating by extracting the Inbox feature into this structure, validate imports/hooks, then apply the same pattern to Audit, Settings, and Users.

## Stack Composition & Usage Principles

- **Routing – React Router v7**
  - Centralised in `src/app/router.tsx`; route elements import feature barrels only.
  - Nested routes should render feature `routes/<Name>Route.tsx` components so data orchestration stays next to the feature code.
  - Prefer loader-free routes; fetch inside feature hooks via TanStack Query to keep routing declarative.

- **Server State – TanStack Query v5**
  - Feature `hooks/` expose `use<Thing>Query`/`use<Thing>Mutation` that hide query keys and fetchers.
  - Keep query keys co-located (e.g., `const DOCUMENTS_QUERY_KEY = [...]`) to avoid collisions.
  - Side-effects (toasts, cache updates) live inside the hook or route component, never inside `api/`.

- **Client State – Zustand**
  - Global stores (`src/stores/`) are for cross-feature concerns (API health, theme).
  - Feature-specific local state stays in component state or feature hooks; avoid creating a store unless multiple routes need it.

- **Internationalisation**
  - Shared locale strings remain in `src/i18n/locales`.
  - Feature-specific strings sit in `features/<feature>/i18n`; the loader merges everything using `import.meta.glob`.
  - Always add English strings first, then mirror keys across other locales.

- **UI Components**
  - Design system components are based on [Base UI](https://base-ui.com/) library. Use [base ui component index](./base-ui-index.md) for reference.
  - Design system primitives live under `src/ui/` and accept only styling/layout props.
  - Feature folders compose those primitives into domain-specific widgets (`components/`).
  - When a widget becomes shared, move it to `src/shared/ui/` (or keep under `src/ui/`) and update imports via the established aliases (`@shared`, `@features`).

- **HTTP & Services**
  - `src/services/api.ts` houses base fetch helpers and shared types; feature `api/` files wrap these to express intent (`listDocuments`, `putSettings`).
  - Avoid importing `services/api.ts` directly inside components; go through the feature API exports.
  - If a feature requires mock data, keep it in `api/mock.ts` (or similar) alongside the real fetcher.
