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
