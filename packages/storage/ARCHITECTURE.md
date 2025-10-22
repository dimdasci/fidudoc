# Storage Service Architecture - Screaming Architecture + DDD

## Overview

The Storage service has been reorganized to follow **Screaming Architecture** combined with **Domain-Driven Design (DDD)** and **Hexagonal Architecture**. This structure immediately communicates the business capabilities of the system.

## Folder Structure

```
src/
├── index.ts                      # Application entry point & service composition
├── Settings.ts                   # 👈 Settings business capability (top-level)
├── Documents.ts                  # 👈 Documents business capability (top-level)
├── Users.ts                      # 👈 Users business capability (top-level)
│
├── Domain/                       # Core business rules & shared types
│   ├── types.ts                 # Domain entities (Settings, Document, User, AuditLog)
│   ├── constants.ts             # Business domain constants
│   ├── mocks.ts                 # Mock data generators
│   └── index.ts                 # Public API
│
├── Settings/                    # Settings bounded context (implementation layers)
│   ├── Api.ts                   # HTTP contract definitions
│   └── Http.ts                  # HTTP request/response handlers
│
├── Documents/                   # Documents bounded context (implementation layers)
│   ├── Api.ts                   # HTTP contract definitions
│   └── Http.ts                  # HTTP request/response handlers
│
├── Users/                       # Users bounded context (implementation layers)
│   ├── Api.ts                   # HTTP contract definitions
│   └── Http.ts                  # HTTP request/response handlers
│
├── middleware/                  # Cross-cutting concerns
│   ├── deduplication.ts        # Request deduplication
│   └── logging.ts               # Request/response logging
│
└── mocks/                       # Legacy (can be removed)
    └── data.ts                  # Kept for compatibility (see Domain/mocks.ts)
```

## Architecture Patterns

### 1. Screaming Architecture
The **top-level files immediately communicate what the system does**:
- `Settings.ts` - "This system manages settings!"
- `Documents.ts` - "This system handles documents!"
- `Users.ts` - "This system manages users!"

Unlike traditional layer-based folder structures (`controllers/`, `services/`, `models/`), this structure screams the business domain.

### 2. Hexagonal Architecture (Ports & Adapters)
```
Domain Layer (Core business rules)
    ↓ depends on
Service Layer (Business logic orchestration)
    ↓ depends on
HTTP Layer (Adapters)
```

**Each bounded context follows this pattern:**
- **Service** (`Settings.ts`, `Documents.ts`, `Users.ts`) - Pure business logic
- **HTTP** (`Settings/Http.ts`, etc.) - Adapt HTTP requests to service calls
- **API** (`Settings/Api.ts`, etc.) - Define HTTP contracts

### 3. Domain-Driven Design
- **Domain Layer** (`Domain/`) - Shared business concepts and rules
  - Core entities: `Settings`, `Document`, `User`, `AuditLog`
  - Business constants and enums
  - Mock data generators for development
- **Bounded Contexts** - Each business capability owns its complete vertical slice
  - `Settings/` - Settings management capability
  - `Documents/` - Document management capability
  - `Users/` - User management capability

### 4. Dependency Inversion
Services expose business interfaces, not implementation details:

```typescript
// Settings.ts - Business capability exposed at top level
export interface ISettings {
  getSettings: () => Promise<Settings>;
  updateSettings: (settings: Settings) => Promise<...>;
}

export function createSettingsService(): ISettings { ... }
```

HTTP handlers depend on service interfaces:

```typescript
// Settings/Http.ts - Adapts HTTP to business service
export function registerSettingsRoutes(app: Express, settingsService: ISettings) { ... }
```

## Service Composition in `index.ts`

```typescript
// 1. Initialize business services
const settingsService = createSettingsService();
const documentsService = createDocumentsService();
const usersService = createUsersService();

// 2. Register HTTP routes (adapters)
registerSettingsRoutes(app, settingsService);
registerDocumentsRoutes(app, documentsService);
registerUsersRoutes(app, usersService);
```

This clean composition shows exactly what the application does without implementation details.

## Layer Responsibilities

### Domain Layer (`Domain/`)
- **types.ts** - Pure TypeScript types for entities
- **constants.ts** - Business domain constants (roles, document types, statuses)
- **mocks.ts** - Mock data generators for development
- **index.ts** - Public API exports

### Service Layer (`Settings.ts`, `Documents.ts`, `Users.ts`)
- Orchestrates business operations
- Implements `IService` interface
- In development: Returns mock data
- In production: Would interact with repositories and databases

### HTTP Layer (`Settings/Http.ts`, `Documents/Http.ts`, `Users/Http.ts`)
- Maps Express routes to service operations
- Handles request/response transformation
- Implements error handling

### HTTP Contract Layer (`Settings/Api.ts`, `Documents/Api.ts`, `Users/Api.ts`)
- Defines TypeScript types for HTTP requests/responses
- Serves as contract between frontend and backend
- Can be extended to support OpenAPI/Swagger

## Key Features

### Clear Separation of Concerns
- **Domain** knows nothing about HTTP or databases
- **Services** know about domain logic, not HTTP details
- **HTTP handlers** map requests to service calls

### Testability
Each layer can be tested independently:
```typescript
// Test domain logic (in production: with database)
const service = createDocumentsService();
const docs = await service.listDocuments({ status: "approved" });

// Test HTTP integration
app.get("/test", ...);
await request(app).get("/documents").expect(200);
```

### Scalability
Adding a new business capability is straightforward:
1. Create domain types in `Domain/types.ts`
2. Create service file `CapabilityName.ts` with `createCapabilityNameService()`
3. Create `CapabilityName/Api.ts` for HTTP contracts
4. Create `CapabilityName/Http.ts` for HTTP handlers
5. Register routes in `index.ts`

### Discoverability
New developers immediately understand the system:
- Top-level files show business capabilities
- Bounded context folders show implementation details
- Consistent file naming across contexts

## API Endpoints

### Settings Context
- `GET /settings` - Retrieve system settings
- `PUT /settings` - Update system settings

### Documents Context
- `GET /documents` - List documents with filtering
- `GET /documents/:id` - Get document metadata
- `GET /documents/:id/preview` - Get document preview
- `GET /documents/:id/extracted-data` - Get extracted structured data
- `POST /documents/approve` - Approve documents
- `POST /documents/reject` - Reject documents

### Users Context
- `GET /users` - List users
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `GET /audit-log` - Get audit trail

## Next Steps for Production

### 1. Replace Mock Implementation with Repositories
```typescript
// Currently: generateMockDocuments(12)
// Production: documentRepo.find({ status: 'pending_approval' })
```

### 2. Add Database Layer
Create `Documents/Repo.ts` with actual database queries:
```typescript
export class DocumentsRepo extends Effect.Service<DocumentsRepo>() { ... }
```

### 3. Add Authorization
Create `Documents/Policy.ts` for authorization rules:
```typescript
export class DocumentsPolicy extends Effect.Service<DocumentsPolicy>() { ... }
```

### 4. Implement Validation
Add input validation using effect/Schema:
```typescript
const CreateDocumentSchema = Schema.Struct({ ... });
```

### 5. Convert to Effect Services
For consistency with the project's tech stack:
```typescript
export class Documents extends Effect.Service<Documents>()("Documents", {
  effect: Effect.gen(function*() {
    // Service implementation
  })
})
```

## File Naming Convention

The same names appear consistently across layers, making it obvious which files work together:

```
Domain/types.ts         → Core definition
Settings.ts             → Business orchestration
Settings/Api.ts         → HTTP contract
Settings/Http.ts        → HTTP handlers
Settings/Policy.ts      → Authorization (future)
Settings/Repo.ts        → Data access (future)
```

## Benefits of This Structure

1. **Business Intent** - Folder names tell what the system does
2. **Consistent Layering** - Every bounded context has the same structure
3. **Separation of Concerns** - Each file has a single, clear responsibility
4. **Testability** - Each layer can be tested independently
5. **Discoverability** - New developers know exactly where to find things
6. **Scalability** - Easy to add new bounded contexts
7. **Maintainability** - Clear dependencies and relationships

---

**This architecture demonstrates "Screaming Architecture" at its finest!** The structure immediately communicates what the system does (Settings, Documents, Users management) without requiring deep knowledge of the implementation details.
