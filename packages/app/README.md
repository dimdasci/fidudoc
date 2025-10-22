# Fidudoc Web Application

A modern, production-ready web application for intelligent document operations platform serving European professional services. Built with industry best practices for type safety, internationalization, and performance.

## Project Overview

The Fidudoc web application provides infrastructure for document storage → validation → intelligence → search, helping professional services firms (fiduciaries, accountants, fund administrators) process hundreds of documents monthly with automated classification, compliance validation, and entity relationship tracking.

## Technology Stack

### Core Framework & Routing

- **React 19** - Modern UI library with concurrent rendering
- **React Router v7** - Client-side routing with lazy code splitting
- **TypeScript 5.9** - Strict type safety (strict mode enabled)
- **Vite 5.4** - Fast dev server and optimized build

### State Management & Data

- **TanStack Query v5** - Server state, caching, and synchronization
- **Zustand v4.5** - Lightweight UI state management
- **Effect/Schema** - Typed services, runtime validation, and structured error handling

### Internationalization

- **Lingui i18n** - ICU-compliant message formatting and plural handling
- Supported languages: English (en), Spanish (es), French (fr), German (de)
- Browser locale detection with localStorage persistence
- Language switcher component in header

### UI & Layout

- **React Resizable Panels** - 3-pane resizable dashboard layout
- **CSS-in-JS** - Inline styles with TypeScript type safety
- Professional design with accessibility in mind

### Development Tools

- **Biome** - Fast linting and formatting
- **dprint** - Code formatter (line width: 86)
- **Node.js 23+** - Runtime environment

## Project Structure

```
packages/app/
├── src/
│   ├── app/
│   │   ├── router.tsx              # React Router configuration
│   │   └── providers.tsx           # App-level providers (Query, i18n, Router)
│   ├── features/
│   │   ├── inbox/
│   │   │   ├── routes.tsx          # Inbox page component
│   │   │   └── useInvoices.ts      # React Query hook for invoices
│   │   └── kyc/
│   │       └── routes.tsx          # KYC page component
│   ├── ui/
│   │   ├── AppShell.tsx            # 3-pane layout shell
│   │   ├── LanguageSwitcher.tsx    # Language selector component
│   │   └── primitives.tsx          # Reusable UI components (placeholder)
│   ├── services/
│   │   ├── client.ts               # Effect service adapter for React Query
│   │   └── invoices.ts             # Invoice service with Effect & Schema
│   ├── stores/
│   │   └── ui.ts                   # Zustand UI state store
│   ├── i18n/
│   │   ├── i18n.ts                 # Lingui configuration & locale detection
│   │   └── locales/
│   │       ├── en/messages.js      # English messages
│   │       ├── es/messages.js      # Spanish messages
│   │       ├── fr/messages.js      # French messages
│   │       └── de/messages.js      # German messages
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles
├── index.html                      # HTML template
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
├── biome.json                      # Biome linter configuration
├── lingui.config.js                # Lingui i18n configuration
└── package.json                    # Dependencies and scripts
```

## Development Setup

### Prerequisites

- **Node.js**: v23 or higher
- **pnpm**: v10.13.1 or higher (workspace package manager)

### Installation

From the monorepo root:

```bash
# Install all dependencies
pnpm install

# Install app-specific dependencies (if needed)
pnpm --filter @fidudoc/app install
```

## Development Commands

### Running the Development Server

```bash
# Start Vite dev server with HMR
pnpm dev

# Or directly in app package
pnpm --filter @fidudoc/app dev
```

The app will be available at `http://localhost:5173`

### Code Quality

#### Linting (Biome)

```bash
# Check for linting issues
pnpm lint

# Fix linting issues automatically
pnpm lint:fix
```

#### Code Formatting (dprint)

```bash
# Check code formatting
pnpm format:check

# Format all files
pnpm format
```

#### Type Checking (TypeScript)

```bash
# Strict type checking
pnpm typecheck
```

#### Full Quality Check

```bash
# Run lint + format check (same as CI)
pnpm check

# Fix all issues automatically
pnpm check:fix
```

### Build

```bash
# Production build with i18n compilation
pnpm build

# Preview production build
pnpm preview
```

### Internationalization

```bash
# Extract messages from code (generates .po files)
pnpm i18n:extract

# Compile message catalogs to JS (generates .js files)
pnpm i18n:compile
```

## Architecture

### Separation of Concerns

- **Routing**: HTTP routing and client-side navigation via React Router
- **Effect**: Domain logic, services, and business rules with typed error handling
- **React Query**: Server state synchronization and caching
- **Zustand**: UI state (selections, modals, filters)

### Type Safety

- TypeScript with **strict mode** enabled from day one
- Schema validation at service layer with `@effect/schema`
- All API contracts defined with typed schemas
- No `any` types in application code

### State Management Pattern

```
┌─────────────────────────────────────┐
│         React Component              │
├─────────────────────────────────────┤
│  Local State (useState)              │
│  UI State (useUI - Zustand)          │
│  Server State (useQuery - React Query)
└─────────────────────────────────────┘
          v
┌─────────────────────────────────────┐
│      Zustand (UI State)              │
│  - selectedId, filters, modals       │
└─────────────────────────────────────┘
          v
┌─────────────────────────────────────┐
│   React Query (Server State)         │
│  - Caching, deduplication, sync      │
│  - Stale time management             │
└─────────────────────────────────────┘
          v
┌─────────────────────────────────────┐
│   Effect Services (Business Logic)   │
│  - Typed APIs, error handling        │
│  - Schema validation                 │
│  - Effect.runPromise adapter         │
└─────────────────────────────────────┘
```

### Internationalization Pattern

1. **Extract**: Mark text with `<Trans id="msg.key">Text</Trans>`
2. **Compile**: `pnpm i18n:compile` generates JS catalogs
3. **Detect**: Browser locale detected on first load
4. **Persist**: User preference saved to localStorage
5. **Switch**: Language switcher buttons update locale in real-time

## Key Features

### Browser Locale Detection

The app automatically detects and applies the user's browser language on first visit:

- Checks browser's `navigator.language`
- Falls back to saved preference in localStorage
- Defaults to English if unsupported language detected
- Supports: English, Spanish, French, German

### 3-Pane Layout

Resizable dashboard with three panels:

- **Left Panel** (22%, min 15%) - Navigation
- **Center Panel** (flex, min 30%) - Main content area
- **Right Panel** (28%, min 20%) - Details/properties
- **Resizable separators** with visual feedback on hover

### Route-Level Code Splitting

Features are lazily loaded via React Router for optimal bundle size:

```typescript
{
  path: "kyc",
  lazy: () => import("../features/kyc/routes").then(m => ({
    Component: m.KycRoute,
  })),
}
```

### API Integration Ready

Service layer prepared for backend integration:

```typescript
// src/services/invoices.ts
export const fetchInvoices = Effect.tryPromise({
  try: async () => {
    const res = await fetch("/api/invoices");
    // Response validated with Effect/Schema
    return Schema.decodeUnknownSync(Schema.Array(Invoice))(json);
  },
  catch: (e) => e as Error,
});

// Usage in components
const { data } = useQuery({
  queryKey: ["invoices"],
  queryFn: () => run(fetchInvoices),
  staleTime: 30_000,
});
```

## Configuration Files

### vite.config.ts

```typescript
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: "localhost" },
});
```

### tsconfig.json

- **Target**: ES2022
- **Module**: ESNext
- **Strict**: true (no implicit any, strict null checks)
- **JSX**: react-jsx

### biome.json

Extends root biome config with app-specific overrides:

- Disables `useUniqueElementIds` rule for Lingui Trans message IDs

### lingui.config.js

```javascript
export default {
  locales: ["en", "es", "fr", "de"],
  catalogs: [{
    path: "src/i18n/locales/{locale}/messages",
    include: ["src"],
  }],
  format: formatter({ style: "minimal" }),
};
```

## Development Best Practices

### Code Organization

1. **Keep server state in React Query** - API responses, lists, pagination
2. **Keep UI state in Zustand** - Selected items, open modals, sorting/filtering
3. **Keep side-effects in Effect** - API calls, file operations, async work

### Import Ordering

Imports are sorted alphabetically by dprint:

```typescript
// 1. External packages
import { Trans } from "@lingui/react";
import { useQuery } from "@tanstack/react-query";

// 2. Relative imports (parent)
import { activateLocale } from "../i18n/i18n";

// 3. Relative imports (sibling)
import { LanguageSwitcher } from "./LanguageSwitcher";
```

### Message IDs in i18n

Use hierarchical, descriptive message IDs:

```typescript
// Good
<Trans id="msg.app.title">Fiduciary Ops</Trans>
<Trans id="msg.inbox.description">Document processing interface</Trans>
<Trans id="msg.status.connected">Status: Connected</Trans>

// Avoid
<Trans id="title">Fiduciary Ops</Trans>
<Trans id="desc1">Document processing interface</Trans>
```

### Error Handling

Use Effect for structured error handling:

```typescript
export const fetchInvoices = Effect.tryPromise({
  try: async () => {/* ... */},
  catch: (e) => new InvoiceError(e),
});
```

### Testing Query Functions

Use `run` adapter to convert Effect to Promise:

```typescript
import { run } from "../services/client";

// In tests or hooks
const result = await run(fetchInvoices);
```

## Performance Considerations

### Bundle Size

- Route-level code splitting reduces initial bundle
- Tree-shaking enabled in Vite
- Message catalogs are separate files (loaded on demand by locale)

### Rendering Optimization

- Zustand provides atomic updates (no provider re-renders)
- React Query manages server state efficiently
- Memoization available via `memo()` and `useMemo()` for expensive renders

### Network

- React Query caches responses with configurable `staleTime`
- Deduplication prevents duplicate requests in-flight
- Consider pagination for large lists

## Troubleshooting

### Dev Server Won't Start

```bash
# Kill existing process
pkill -f "vite"

# Clear cache and restart
pnpm dev
```

### Type Errors in IDE

```bash
# Rebuild TypeScript
pnpm typecheck

# Restart IDE/LSP server
```

### i18n Messages Not Appearing

```bash
# Ensure messages are compiled
pnpm i18n:compile

# Clear browser localStorage
localStorage.clear();

# Reload browser
```

### Stale HMR Updates

```bash
# Restart dev server
# Clear browser cache (Cmd/Ctrl + Shift + Delete)
# Reload page
```

## Environment Variables

Currently, the app doesn't require environment variables for development. When connecting to the backend API, add:

```bash
# .env (not committed)
VITE_API_BASE_URL=http://localhost:3000/api
```

Then use in services:

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
```

## Next Steps for Team

1. **Implement feature pages** - Add more routes in `src/features/`
2. **Connect API endpoints** - Update services with real API calls
3. **Add UI components** - Build component library in `src/ui/primitives.tsx`
4. **Expand tests** - Add unit tests (Jest/Vitest recommended)
5. **Polish i18n** - Review and improve translations
6. **Performance audit** - Run Lighthouse and optimize

## Resources

- [React 19 Docs](https://react.dev)
- [React Router v7 Docs](https://reactrouter.com)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Effect Documentation](https://effect.website)
- [Lingui i18n Docs](https://lingui.dev)
- [Vite Docs](https://vitejs.dev)

## Contributing

- Follow the architecture and file structure outlined above
- Run `pnpm check` before committing
- Write meaningful commit messages
- Keep components focused and reusable
- Add translations for new UI text

## License

Copyright (c) Fidudoc. All rights reserved.
