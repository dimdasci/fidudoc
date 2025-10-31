# Fidudoc App Architecture – Feature-First Structure

## Overview

This React application follows a feature-first structure inspired by the storage service. Each business capability (Inbox, Audit, Settings, Users…) owns its route, data access, local UI, and translations. Shared primitives live under `shared/`, while cross-cutting app wiring sits in `app/`. The folder names should communicate the product surface at a glance.

## Current Folder Structure

```
src/
├── app/                          # Application shell, router, providers, global config
│   ├── providers.tsx             # React Query, i18n, theme providers
│   └── router.tsx                # Centralised routing with React Router v7
│
├── ui/                           # Design system primitives (shared components)
│   ├── AppHeader.tsx             # Global app header with navigation
│   ├── AppShell.tsx              # Main layout wrapper
│   ├── Button/                   # Button component variants
│   ├── Dialog/                   # Modal dialog primitives
│   ├── Input/                    # Form input components
│   ├── Menu/                     # Dropdown menu components
│   ├── Select/                   # Select/dropdown components  
│   ├── Table.tsx                 # Data table component
│   ├── ThemeSwitcher/            # Dark/light theme toggle
│   ├── Toolbar/                  # Action toolbar component
│   ├── UserMenu.tsx              # User profile dropdown
│   ├── icons/                    # Icon components
│   └── toast.ts                  # Toast notification utilities
│
├── lib/                          # Cross-cutting utilities
│   ├── http/                     # HTTP client configuration
│   └── react-query/              # React Query helpers and configuration
│
├── services/                     # API services and shared types
│   ├── api.ts                    # Base API client and shared utilities
│   └── client.ts                 # HTTP client setup
│
├── stores/                       # Global Zustand stores
│   ├── api.ts                    # API health and global state
│   └── ui.ts                     # UI state (themes, modals, etc.)
│
├── i18n/                         # Internationalization
│   ├── i18n.ts                   # i18n configuration and setup
│   └── locales/                  # Translation files per locale
│       ├── en.json
│       ├── es.json
│       ├── fr.json
│       └── de.json
│
└── features/                     # Business capability modules
    ├── auth/                     # Authentication (sign in/out, sessions)
    │   ├── index.ts              # Feature exports
    │   ├── routes/               # Auth-related routes
    │   ├── components/           # Auth UI components
    │   ├── hooks/                # Auth state management
    │   ├── services/             # Auth API calls
    │   └── types.ts              # Auth-specific types
    │
    ├── users/                    # User management
    │   ├── index.ts
    │   ├── routes/
    │   │   └── UsersRoute.tsx
    │   ├── api/
    │   │   └── users.api.ts      # User API calls and types
    │   ├── hooks/                # User data hooks (queries/mutations)
    │   ├── components/           # User UI components
    │   ├── lib/                  # User-specific utilities
    │   └── i18n/                 # User feature translations
    │
    ├── inbox/                    # Document inbox and triage
    ├── audit/                    # Audit log and compliance
    ├── settings/                 # Application settings
    ├── roles/                    # Role and permissions management
    └── landing/                  # Landing/welcome pages
```

## Implementation Notes

- **Feature encapsulation:** Each feature exports what the rest of the app needs via its `index.ts` (routes, API functions, types). Internal implementation stays private to that folder.
- **Import aliases:** Use `@features/*` for feature imports and `@shared/*` for shared utilities (maps to `src/*`).
- **Data boundaries:** Feature `api/` folders contain typed API calls; `services/` provides the base HTTP infrastructure.
- **UI component hierarchy:**
  - `src/ui/` = Design system primitives (Button, Table, Dialog)
  - `features/*/components/` = Feature-specific compositions
  - App-level layouts (AppShell, AppHeader) sit in `src/ui/` as they're shared infrastructure
- **Translations:** Feature-specific translations in `features/*/i18n/`, global strings in `src/i18n/locales/`
- **State management:**
  - Global cross-feature state → `src/stores/` (Zustand)
  - Server state → Feature hooks using TanStack Query
  - Local component state → React state or feature hooks
- **Routing:** Centralized in `src/app/router.tsx`, imports feature route components via barrel exports

**Adding new features:** Create `features/<name>/` with the established subfolders. Export route, API functions, and types via `index.ts` for clean imports across the app.

## Current Implementation Status

**Completed Features:**

- ✅ **Authentication** (`features/auth/`) - Sign in/out with Supabase OTP, session management
- ✅ **Users** (`features/users/`) - User management with full CRUD operations
- ✅ **Landing** (`features/landing/`) - Welcome and onboarding flows

**In Progress:**

- 🚧 **Inbox** (`features/inbox/`) - Document triage and processing
- 🚧 **Audit** (`features/audit/`) - Compliance and audit logging
- 🚧 **Settings** (`features/settings/`) - Application configuration
- 🚧 **Roles** (`features/roles/`) - Role-based access control

**Infrastructure:**

- ✅ Design system components in `src/ui/` using Base UI primitives
- ✅ HTTP client with authentication in `src/services/`
- ✅ React Query configuration in `src/lib/react-query/`
- ✅ Zustand stores for global state in `src/stores/`
- ✅ i18n setup with feature-scoped translations

## Backend Integration

The frontend integrates with a production-grade Effect-TS backend service:

**Authentication Flow:**

- Supabase Auth for JWT token management and OTP-based authentication
- Backend validates JWTs and extracts user context (accountId, userId) from token metadata
- Multi-tenant data isolation enforced at the API layer

**API Communication:**

- RESTful HTTP APIs with typed request/response schemas
- Feature API files (`features/*/api/*.api.ts`) provide typed wrappers around HTTP calls
- TanStack Query handles caching, invalidation, and optimistic updates
- Error handling with domain-specific error types from backend

**Data Flow:**

```
Component → Feature Hook → Feature API → Backend Service → Database
         ← React Query  ← HTTP Response ← Effect Pipeline ←
```

**Backend Architecture:**

- Effect-TS for type-safe, composable business logic
- Domain-driven design with proper error handling
- Transaction boundaries for data consistency
- Multi-tenant account isolation
- Production-grade user management with Supabase Auth integration

## Stack Composition & Usage Principles

- **Routing – React Router v7**
  - Centralised in `src/app/router.tsx`; route elements import feature barrels only.
  - Nested routes should render feature `routes/<Name>Route.tsx` components so data orchestration stays next to the feature code.
  - Prefer loader-free routes; fetch inside feature hooks via TanStack Query to keep routing declarative.

- **Server State – TanStack Query v5**
  - Feature `hooks/` expose `use<Thing>Query`/`use<Thing>Mutation` that hide query keys and fetchers.
  - Keep query keys co-located (e.g., `const DOCUMENTS_QUERY_KEY = [...]`) to avoid collisions.
  - Side-effects (toasts, cache updates) live inside the hook or route component, never inside `api/`.
  - Prefer the shared `refreshQueryWithFreshData` helper (`src/lib/react-query/refreshQueryWithFreshData.ts`) when live data must bypass backend caching. Fetch with a cache-busting flag and `setQueryData` on success; if the fetch fails, fall back to `invalidateQueries({ queryKey, exact: true })`.

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
  - Feature folders compose those primitives into domain-specific widgets (`features/*/components/`).
  - App-level shared components (AppShell, AppHeader, UserMenu) remain in `src/ui/` since they're infrastructure.
  - Use `@shared/ui/ComponentName` imports for shared components from features.

- **HTTP & Services**
  - `src/services/api.ts` provides base fetch utilities and shared API types
  - `src/services/client.ts` configures the HTTP client with authentication and base URLs
  - Feature `api/` files contain typed functions that express business intent (`listUsers`, `createDocument`)
  - Components import API functions from feature barrel exports (`@features/users`), never directly from `services/`
  - Feature API files export both functions and TypeScript types for that domain
