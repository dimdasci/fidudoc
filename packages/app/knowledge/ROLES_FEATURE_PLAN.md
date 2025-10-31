# Roles & Permissions Management Feature - Implementation Plan

## Overview

This document outlines the implementation plan for the Roles & Permissions management feature in the Fidudoc application. The feature provides an interface to manage roles and permissions for the Casbin RBAC model.

## Permission Semantics (Option A: Strict Predefined)

**Roles:** `["admin", "user"]`

**Objects (aligned with navigation):** `["documents", "clients", "inspections", "settings", "audit"]`

**Actions:** `["read", "write", "delete"]`

Constants defined in `features/roles/lib/constants.ts`

---

## 1. Feature Structure

```
features/roles/
├── api/
│   ├── roles.api.ts           # fetchWithAuth wrappers for all endpoints
│   └── roles.types.ts         # TypeScript types for API responses
├── components/
│   ├── RolesHeader.tsx        # Page header "Roles & Permissions"
│   ├── RolesTable.tsx         # Main table: Role | Users | Permissions | Actions
│   ├── ManagePermissionsDialog.tsx  # Modal for view+edit permissions
│   ├── ManageUsersDialog.tsx  # Modal for user-role assignment
│   └── AddPermissionForm.tsx  # Object dropdown + Action dropdown + Add button
├── hooks/
│   ├── useRolesQuery.ts       # GET /accounts/:accountId/roles?includeStats=true
│   ├── useRolePermissions.ts  # GET/POST/DELETE permissions for a role
│   └── useRolePermissionsQuery.ts # Separate query hook for fetching permissions
├── lib/
│   ├── constants.ts           # ROLES, OBJECTS, ACTIONS constants
│   └── formatters.ts          # Format "documents / read" for display
├── i18n/
│   ├── en.json                # English translations
│   ├── de.json                # German translations
│   ├── fr.json                # French translations
│   └── es.json                # Spanish translations
└── routes/
    └── RolesRoute.tsx         # Main route component
```

---

## 2. UI Components Detail

### RolesTable (`components/RolesTable.tsx`)

**Columns:**

- **Role** (text-primary): admin, user
- **Users** (monospace Inter digits): 12, 5
- **Permissions** (monospace Inter digits): 6, 3
- **Actions**: Two buttons - "Manage Users", "Manage Permissions" (conditional)

**Features:**

- Uses existing `Table` component from `src/ui/Table.tsx`
- Loading/error states handled by Table component
- Empty state: "No roles found"
- **Business Logic**: Permission management disabled when userCount === 0 (users must be assigned first)

### ManagePermissionsDialog (`components/ManagePermissionsDialog.tsx`)

**Modal Structure:**

- Title: "Manage Permissions for {roleName}"
- Section 1: **Current Permissions**
  - Table with columns: Object | Action | Remove
  - Each row shows permission (e.g., "documents / read")
  - Inline confirmation UX (replaces browser confirm dialogs)
  - Empty state: "No permissions assigned to this role"
- Section 2: **Add Permission**
  - Uses `AddPermissionForm` component
  - Supports wildcard options: "*" for all objects/actions
  - Validation: don't allow duplicate permissions
- Footer: Close button

### ManageUsersDialog (`components/ManageUsersDialog.tsx`)

**Modal Structure:**

- Title: "Manage Users for {roleName}"
- Section 1: **Current Users**
  - Table with columns: User | Email | Remove
  - Individual remove buttons for each user
  - Empty state: "No users assigned to this role"
- Section 2: **Add User**
  - Dropdown showing unassigned users
  - Filtered list excludes already assigned users
  - Empty state: "All users are already assigned to this role"
- Footer: Close button

### AddPermissionForm (`components/AddPermissionForm.tsx`)

**Form Elements:**

- Two dropdowns side-by-side:
  - Object select: documents, clients, inspections, settings, audit
  - Action select: read, write, delete
- Add button (disabled if both not selected)
- Optimistic update on success
- Toast notification on success/error

---

## 3. API Integration

### Endpoints Used

**Roles & Permissions:**

- `GET /accounts/:accountId/roles?includeStats=true` → List roles with counts
- `GET /accounts/:accountId/roles/:roleName/permissions` → Get permissions for role
- `POST /accounts/:accountId/roles/:roleName/permissions` → Add permission
  - Body: `{ object: "documents", action: "read" }`
- `DELETE /accounts/:accountId/roles/:roleName/permissions` → Remove permission
  - Body: `{ object: "documents", action: "read" }`

**User-Role Management:**

- `GET /accounts/:accountId/roles/:roleName/users` → Get users assigned to role
- `POST /accounts/:accountId/users/:userId/roles/:roleName` → Assign role to user
- `DELETE /accounts/:accountId/users/:userId/roles/:roleName` → Remove role from user
- `GET /users` → List all users (for assignment dropdown)

### React Query Keys

- `["roles", accountId]` → Roles list with statistics
- `["roles", accountId, roleName, "permissions"]` → Role permissions
- `["roles", accountId, roleName, "users"]` → Role user assignments
- `["users"]` → All users list

### Error Handling

- Toast notifications for errors
- Retry failed requests automatically (React Query default)
- Show loading spinners during mutations

---

## 4. Type Definitions (`api/roles.types.ts`)

```typescript
export type SystemRole = "admin" | "user";

export type RoleName = string;

export type PermissionObject =
  | "*"
  | "documents"
  | "clients"
  | "inspections"
  | "settings"
  | "audit";

export type PermissionAction = "*" | "read" | "write" | "delete";

export interface Permission {
  domain: string;
  object: PermissionObject;
  action: PermissionAction;
}

export interface RoleWithStats {
  id: string;
  role: RoleName;
  permissionCount: number;
  userCount: number;
}

export interface RolePermissionsResponse {
  role: RoleName;
  domain: string;
  permissions: Permission[];
}
```

---

## 5. Constants (`lib/constants.ts`)

```typescript
export const ROLES = ["admin", "user"] as const;

export const PERMISSION_OBJECTS = [
  "*",
  "documents",
  "clients",
  "inspections",
  "settings",
  "audit",
] as const;

export const PERMISSION_ACTIONS = ["*", "read", "write", "delete"] as const;

// Display labels for objects (can be i18n keys)
export const OBJECT_LABELS: Record<string, string> = {
  "*": "roles.objects.all",
  documents: "roles.objects.documents",
  clients: "roles.objects.clients",
  inspections: "roles.objects.inspections",
  settings: "roles.objects.settings",
  audit: "roles.objects.audit",
};

// Display labels for actions (can be i18n keys)
export const ACTION_LABELS: Record<string, string> = {
  "*": "roles.actions.all",
  read: "roles.actions.read",
  write: "roles.actions.write",
  delete: "roles.actions.delete",
};
```

---

## 6. Formatters (`lib/formatters.ts`)

```typescript
export function formatPermission(
  object: string,
  action: string,
): string {
  return `${object} / ${action}`;
}

export function formatRoleName(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
```

---

## 7. Routing

### Update: `src/app/router.tsx`

Add under Settings group:

```typescript
{
  path: "/settings/roles",
  element: (
    <ProtectedRoute>
      <AppShell />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <RolesRoute />,
    },
  ],
}
```

### Update: `src/ui/AppShell.tsx`

Add "Roles & Permissions" link in Settings navigation section

---

## 8. Internationalization

### Translation Keys (all 4 languages)

```json
{
  "roles.title": "Roles & Permissions",
  "roles.subtitle": "Manage roles and their permissions",
  "roles.table.role": "Role",
  "roles.table.permissions": "Permissions",
  "roles.table.users": "Users",
  "roles.table.actions": "Actions",
  "roles.actions.manage": "Manage Permissions",
  "roles.dialog.title": "Manage Permissions for {roleName}",
  "roles.dialog.currentPermissions": "Current Permissions",
  "roles.dialog.addPermission": "Add Permission",
  "roles.dialog.close": "Close",
  "roles.permissions.object": "Object",
  "roles.permissions.action": "Action",
  "roles.permissions.remove": "Remove",
  "roles.permissions.add": "Add",
  "roles.permissions.empty": "No permissions assigned to this role",
  "roles.permissions.confirmRemove": "Click to confirm removal",
  "roles.objects.all": "All Objects",
  "roles.objects.documents": "Documents",
  "roles.objects.clients": "Clients",
  "roles.objects.inspections": "Inspections",
  "roles.objects.settings": "Settings",
  "roles.objects.audit": "Audit",
  "roles.actions.all": "All Actions",
  "roles.actions.read": "Read",
  "roles.actions.write": "Write",
  "roles.actions.delete": "Delete",
  "roles.users.dialog.title": "Manage Users for {roleName}",
  "roles.users.dialog.currentUsers": "Current Users",
  "roles.users.dialog.addUser": "Add User",
  "roles.users.user": "User",
  "roles.users.email": "Email",
  "roles.users.remove": "Remove",
  "roles.users.add": "Add",
  "roles.users.selectUser": "Select User",
  "roles.users.selectUserPlaceholder": "Choose a user to assign",
  "roles.users.empty": "No users assigned to this role",
  "roles.users.allUsersAssigned": "All users are already assigned to this role",
  "roles.users.toast.userAssigned": "User assigned successfully",
  "roles.users.toast.userRemoved": "User removed successfully",
  "roles.users.toast.error": "Failed to update users",
  "roles.toast.permissionAdded": "Permission added successfully",
  "roles.toast.permissionRemoved": "Permission removed successfully",
  "roles.toast.error": "Failed to update permissions",
  "roles.empty": "No roles found"
}
```

---

## 9. Color Scheme (from COLOR_SCHEME_GUIDE.md)

- Table text: `.text-body-sm .text-primary`
- Table headers: `.text-heading`
- Action buttons: `.text-accent` (brand green)
- Secondary info: `.text-secondary`
- Monospace digits: Font family Inter with `font-variant-numeric: tabular-nums`
- No badges, no color coding by permission type

---

## 10. Implementation Order

1. **Setup** - Create feature directory structure
2. **Types & Constants** - Define types and constants with wildcard support
3. **API Layer** - Build API wrappers with fetchWithAuth and cache-busting
4. **React Query Hooks** - Create query and mutation hooks with proper cache management
5. **RolesTable Component** - Main list view with conditional permission management
6. **ManagePermissionsDialog Component** - Modal with inline confirmation UX
7. **ManageUsersDialog Component** - Modal for user-role assignment with dynamic Select
8. **AddPermissionForm Component** - Add permission form with wildcard options
9. **RolesRoute** - Wire everything together with proper dialog state management
10. **Routing** - Add route and navigation link
11. **i18n** - Add translations for all 4 languages
12. **Cache Management** - Implement cache-busting patterns for React 19 + backend deduplication
13. **Testing** - Manual testing with existing backend

---

## 11. Cache Management & Client-Server Communication

### React 19 Dev Mode + Backend Deduplication Challenges

**Issue**: React 19 Strict Mode executes effects twice in development, combined with backend deduplication middleware (5-second TTL) causes stale cache data after mutations.

**Solution Pattern**: Cache-busting with direct cache updates

```typescript
// Bad: Standard invalidation fails due to backend caching
queryClient.invalidateQueries({
  queryKey: ["roles", accountId, roleName, "permissions"],
});

// Good: Cache-busting with timestamp + direct cache update
const freshData = await fetchRolePermissions(accountId, roleName, true); // bustCache = true
queryClient.setQueryData(
  ["roles", accountId, roleName, "permissions"],
  freshData,
);
```

### API Cache-Busting Implementation

**Fetch Functions**: Add optional `bustCache` parameter to bypass backend deduplication:

```typescript
export async function fetchRolePermissions(
  accountId: string,
  roleName: string,
  bustCache = false,
): Promise<RolePermissionsResponse> {
  const url =
    `${API_BASE_URL}/accounts/${accountId}/roles/${roleName}/permissions`;
  const finalUrl = bustCache ? `${url}?t=${Date.now()}` : url;
  // ...
}
```

### Mutation Patterns

**Optimistic Updates**: For immediate UI feedback with rollback capability:

```typescript
onMutate: (async (permission) => {
  await queryClient.cancelQueries({
    queryKey: ["roles", accountId, roleName, "permissions"],
  });
  const previousData = queryClient.getQueryData([
    "roles",
    accountId,
    roleName,
    "permissions",
  ]);

  queryClient.setQueryData(
    ["roles", accountId, roleName, "permissions"],
    (old) => ({
      ...old,
      permissions: old.permissions.filter(p =>
        !(p.object === permission.object && p.action === permission.action)
      ),
    }),
  );

  return { previousData };
});
```

**Cache Invalidation Timing**: Dialog-level invalidation prevents excessive API calls:

```typescript
// Per-mutation: Update specific data only
onSuccess: (async () => {
  const freshData = await fetchRolePermissions(accountId, roleName, true);
  queryClient.setQueryData(
    ["roles", accountId, roleName, "permissions"],
    freshData,
  );
  // Don't invalidate roles list here
});

// Dialog close: Update aggregate data
const handleClose = () => {
  queryClient.invalidateQueries({
    queryKey: ["roles", accountId],
    exact: true,
  });
  onClose();
};
```

### Component State Management

**Select Component Re-rendering**: Force React component recreation when data changes to prevent internal state corruption:

```typescript
<SelectRoot
  key={`select-${availableUsers.length}-${availableUsers.map(u => u.id).join('-')}`}
  value={selectedUserId}
  onValueChange={setSelectedUserId}
>
```

**State Update Timing**: Avoid setting state inside `useMemo` calculations:

```typescript
// Bad: State updates in useMemo cause infinite renders
const availableUsers = useMemo(() => {
  const filtered = allUsers.filter(...);
  if (selectedUserId && !filtered.some(u => u.id === selectedUserId)) {
    setSelectedUserId(""); // Don't do this
  }
  return filtered;
}, [deps]);

// Good: Separate state updates in useEffect
useEffect(() => {
  if (selectedUserId && !availableUsers.some(u => u.id === selectedUserId)) {
    setSelectedUserId("");
  }
}, [selectedUserId, availableUsers]);
```

### Data Consistency Patterns

**Cache Key Structure**: Hierarchical structure supports partial invalidation:

- `["roles", accountId]` - Roles list with statistics
- `["roles", accountId, roleName, "permissions"]` - Role permissions
- `["roles", accountId, roleName, "users"]` - Role user assignments

**Error Boundaries**: Fallback from cache-busting to standard invalidation:

```typescript
try {
  const freshData = await fetchFunction(params, true);
  queryClient.setQueryData(queryKey, freshData);
} catch {
  queryClient.invalidateQueries({ queryKey, exact: true });
}
```

## 12. Out of Scope (Future Work)

- Role creation/deletion UI
- Bulk permission operations
- Permission inheritance visualization
- Audit log integration

---

## 13. Key Design Decisions

✅ **Logical UX Flow** - Users must be assigned to roles before permissions can be managed
✅ **Wildcard Support** - "*" options for both objects and actions to support administrative roles
✅ **Inline Confirmation** - Replace browser confirm dialogs with inline confirmation UI
✅ **Cache-Busting Strategy** - Direct cache updates with timestamp query parameters to handle React 19 + backend deduplication
✅ **Component Re-rendering** - Dynamic keys on Select components to force clean state after data changes
✅ **Single Dialog Pattern** - View and edit in same modal (no separate modes)
✅ **Simple Formatting** - "documents / read" (lowercase, slash separator)
✅ **Monospace Digits** - Clean numerical display without badges
✅ **Feature-first Architecture** - Following existing patterns from Users/Settings
✅ **React Query** - Advanced caching with optimistic updates and fallback strategies

---

## Backend API Reference

All endpoints are account-scoped: `/accounts/:accountId/`

- Authentication: JWT token from `authState.session.accessToken`
- Authorization: Uses Casbin RBAC model
- Multi-tenancy: All operations scoped by accountId from user session
