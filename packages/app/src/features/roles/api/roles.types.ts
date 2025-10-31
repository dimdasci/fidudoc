export type SystemRole = "admin" | "user";

export type RoleName = string;

export type Role = RoleName;

export type PermissionObject =
  | "*" // Wildcard for all objects
  | "documents"
  | "clients"
  | "inspections"
  | "settings"
  | "audit";

export type PermissionAction =
  | "*" // Wildcard for all actions
  | "read"
  | "write"
  | "delete";

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

export interface AddPermissionRequest {
  object: PermissionObject;
  action: PermissionAction;
}

export interface RemovePermissionRequest {
  object: PermissionObject;
  action: PermissionAction;
}
