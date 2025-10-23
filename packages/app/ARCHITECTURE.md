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
