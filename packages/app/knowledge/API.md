# Fidudoc Storage API Reference

**Base URL:** `http://localhost:3000` (dev) | `https://api.fidudoc.com` (prod)

All responses are JSON. Timestamps are ISO 8601.

---

## Settings

### GET `/settings`

```json
{
  "intake": {
    "sources": [
      {
        "id": string,
        "type": "gdrive" | "email" | "portal" | "chat",
        "folderId"?: string,
        "polling": string
      }
    ]
  },
  "routing": {
    "rules": [
      {
        "documentType": string,
        "destination": string
      }
    ]
  },
  "queryTemplates": [
    {
      "name": string,
      "query": Record<string, any>
    }
  ],
  "autoApproval": {
    "enabled": boolean,
    "minConfidence": number
  }
}
```

### PUT `/settings`

Request body: `Partial<Settings>`

Response:

```json
{
  "success": boolean,
  "message": string,
  "settings": Settings
}
```

---

## Documents

### GET `/documents`

Query parameters:

- `status`: `"pending" | "approved" | "rejected"`
- `client_id`: string
- `type`: `"invoice" | "receipt" | "contract" | "lease" | "tax_return" | "unknown"`
- `validation_status`: `"passed" | "failed" | "pending"`
- `period`: `"24h" | "7d" | "30d"` etc.
- `from`: ISO date string
- `to`: ISO date string

Response:

```json
{
  "total": number,
  "documents": Document[]
}
```

### GET `/documents/:id`

Response: `Document`

### GET `/documents/:id/preview`

Response:

```json
{
  "documentId": string,
  "fileName": string,
  "downloadUrl": string,
  "contentType": string,
  "size": number
}
```

### GET `/documents/:id/extracted-data`

Response:

```json
{
  "documentId": string,
  "documentType": string,
  "extractedAt"?: string,
  "data"?: Record<string, any>
}
```

### POST `/documents/approve`

Request:

```json
{
  "ids": string[]
}
```

Response:

```json
{
  "success": boolean,
  "message": string,
  "approvedIds": string[],
  "timestamp": string
}
```

### POST `/documents/reject`

Request:

```json
{
  "ids": string[],
  "reason"?: string
}
```

Response:

```json
{
  "success": boolean,
  "message": string,
  "rejectedIds": string[],
  "reason": string,
  "timestamp": string
}
```

---

## Users

### GET `/users`

Response:

```json
{
  "total": number,
  "users": User[]
}
```

### POST `/users`

Request:

```json
{
  "email": string,
  "name": string,
  "role": "admin" | "operator" | "viewer"
}
```

Response:

```json
{
  "success": boolean,
  "message": string,
  "user": User
}
```

### PUT `/users/:id`

Request:

```json
{
  "name"?: string,
  "role"?: "admin" | "operator" | "viewer",
  "isActive"?: boolean
}
```

Response:

```json
{
  "success": boolean,
  "message": string,
  "user": User
}
```

### GET `/audit-log`

Query parameters:

- `userId`: string
- `action`: string
- `resourceType`: string

Response:

```json
{
  "total": number,
  "auditLogs": AuditLog[]
}
```

---

## Roles & Permissions

All role and permission endpoints require an `accountId` parameter for multi-tenant isolation.

**Permission Model:**

- **Roles** are string identifiers (e.g., `"admin"`, `"member"`, `"viewer"`)
- **Permissions** are defined as `{object, action}` pairs (e.g., `{object: "documents", action: "read"}`)
- **Multi-tenancy** is enforced via `accountId` (used as Casbin domain)
- Users can have different roles in different accounts
- Role inheritance is supported (use `?includeInherited=true`)

### GET `/accounts/:accountId/roles`

List all roles in an account.

Query parameters:

- `includeStats`: `"true"` (optional) - Include permission and user counts

Response (without stats):

```json
{
  "domain": string,
  "roles": string[]
}
```

Response (with stats):

```json
{
  "domain": string,
  "roles": [
    {
      "role": string,
      "permissionCount": number,
      "userCount": number
    }
  ]
}
```

### GET `/accounts/:accountId/roles/:roleName/permissions`

Get all permissions for a specific role.

Response:

```json
{
  "role": string,
  "domain": string,
  "permissions": [
    {
      "domain": string,
      "object": string,
      "action": string
    }
  ]
}
```

### POST `/accounts/:accountId/roles/:roleName/permissions`

Add a permission to a role.

Request:

```json
{
  "object": string,
  "action": string
}
```

Response:

```json
{
  "success": boolean,
  "roleName": string,
  "domain": string,
  "object": string,
  "action": string
}
```

### DELETE `/accounts/:accountId/roles/:roleName/permissions`

Remove a permission from a role.

Request:

```json
{
  "object": string,
  "action": string
}
```

Response:

```json
{
  "success": boolean,
  "roleName": string,
  "domain": string,
  "object": string,
  "action": string
}
```

### POST `/accounts/:accountId/users/:userId/roles/:roleName`

Assign a role to a user.

Response:

```json
{
  "success": boolean,
  "userId": string,
  "roleName": string,
  "domain": string
}
```

### DELETE `/accounts/:accountId/users/:userId/roles/:roleName`

Remove a role from a user.

Response:

```json
{
  "success": boolean,
  "userId": string,
  "roleName": string,
  "domain": string
}
```

### GET `/accounts/:accountId/users/:userId/roles`

Get all roles assigned to a user.

Query parameters:

- `includeInherited`: `"true"` (optional) - Include inherited roles

Response:

```json
{
  "userId": string,
  "domain": string,
  "roles": string[],
  "includeInherited": boolean
}
```

### GET `/accounts/:accountId/roles/:roleName/users`

Get all users assigned to a role.

Query parameters:

- `includeInherited`: `"true"` (optional) - Include users with inherited role

Response:

```json
{
  "roleName": string,
  "domain": string,
  "users": string[],
  "includeInherited": boolean
}
```

### GET `/accounts/:accountId/users/:userId/info`

Get comprehensive user information including all roles and permissions.

Response:

```json
{
  "domain": string,
  "user": string,
  "directRoles": string[],
  "inheritedRoles": string[],
  "allPermissions": [
    {
      "subject": string,
      "domain": string,
      "object": string,
      "action": string
    }
  ]
}
```

### POST `/accounts/:accountId/users/:userId/check-permission`

Check if a user has a specific permission.

Request:

```json
{
  "object": string,
  "action": string
}
```

Response:

```json
{
  "userId": string,
  "domain": string,
  "object": string,
  "action": string,
  "hasPermission": boolean
}
```

### POST `/accounts/:accountId/users`

Get all users in an account with their assigned roles.

Request:

```json
{
  "roles": string[]
}
```

Response:

```json
{
  "domain": string,
  "users": [
    {
      "user": string,
      "roles": string[]
    }
  ]
}
```

**Example Usage:**

```typescript
// 1. List all roles in account
const { roles } = await fetch("/accounts/acc-123/roles").then(r => r.json());
// roles: ["admin", "member", "viewer"]

// 2. Get role details with stats
const { roles: rolesWithStats } = await fetch(
  "/accounts/acc-123/roles?includeStats=true",
).then(r => r.json());
// rolesWithStats: [{role: "admin", permissionCount: 6, userCount: 2}, ...]

// 3. Assign admin role to user
await fetch("/accounts/acc-123/users/user-456/roles/admin", { method: "POST" });

// 4. Add permission to role
await fetch("/accounts/acc-123/roles/admin/permissions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ object: "documents", action: "delete" }),
});

// 5. Check if user has permission
const { hasPermission } = await fetch(
  "/accounts/acc-123/users/user-456/check-permission",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ object: "documents", action: "delete" }),
  },
).then(r => r.json());
// hasPermission: true

// 6. Get user's complete info (roles + permissions)
const userInfo = await fetch("/accounts/acc-123/users/user-456/info").then(r =>
  r.json()
);
// userInfo: { user, directRoles: ["admin"], inheritedRoles: ["admin"], allPermissions: [...] }
```

---

## Data Types

### Document

```typescript
{
  "id": string,
  "fileName": string,
  "documentType": "invoice" | "receipt" | "contract" | "lease" | "tax_return" | "unknown",
  "status": "pending" | "approved" | "rejected",
  "validation_status"?: "passed" | "failed" | "pending",
  "client_id": string,
  "clientName": string,
  "confidence": number,
  "uploadedAt": string,
  "processedAt"?: string,
  "pdfStoragePath": string,
  "jsonStoragePath"?: string,
  "extractedData"?: Record<string, any>,
  "inspectionType"?: "vat" | "lease_vat" | "contract" | null
}
```

### User

```typescript
{
  "id": string,
  "email": string,
  "name": string,
  "role": "admin" | "operator" | "viewer",
  "permissions": string[],
  "createdAt": string,
  "lastLogin"?: string,
  "isActive": boolean
}
```

### AuditLog

```typescript
{
  "id": string,
  "timestamp": string,
  "userId": string,
  "userName": string,
  "action": string,
  "resourceType": string,
  "resourceId": string,
  "details": Record<string, any>
}
```

### Settings

```typescript
{
  "intake": {
    "sources": Array<{
      "id": string,
      "type": "gdrive" | "email" | "portal" | "chat",
      "folderId"?: string,
      "polling": string
    }>
  },
  "routing": {
    "rules": Array<{
      "documentType": string,
      "destination": string
    }>
  },
  "queryTemplates": Array<{
    "name": string,
    "query": Record<string, any>
  }>,
  "autoApproval": {
    "enabled": boolean,
    "minConfidence": number
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": string
}
```

### 401 Unauthorized

```json
{
  "error": string
}
```

### 403 Forbidden

```json
{
  "error": string
}
```

### 404 Not Found

```json
{
  "error": string
}
```

### 500 Internal Server Error

```json
{
  "error": string
}
```
