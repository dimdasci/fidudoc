import type { PermissionAction, PermissionObject, SystemRole } from "../api/roles.types";

export const ROLES: readonly SystemRole[] = ["admin", "user"];

export const PERMISSION_OBJECTS: readonly PermissionObject[] = [
  "*", // Wildcard for all objects
  "documents",
  "clients",
  "inspections",
  "settings",
  "audit",
] as const;

export const PERMISSION_ACTIONS: readonly PermissionAction[] = [
  "*", // Wildcard for all actions
  "read",
  "write",
  "delete",
] as const;

// Display labels for objects (i18n keys)
export const OBJECT_LABELS: Record<string, string> = {
  "*": "roles.objects.all", // Wildcard label
  documents: "roles.objects.documents",
  clients: "roles.objects.clients",
  inspections: "roles.objects.inspections",
  settings: "roles.objects.settings",
  audit: "roles.objects.audit",
};

// Display labels for actions (i18n keys)
export const ACTION_LABELS: Record<string, string> = {
  "*": "roles.actions.all", // Wildcard label
  read: "roles.actions.read",
  write: "roles.actions.write",
  delete: "roles.actions.delete",
};
