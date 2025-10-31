/**
 * Format permission as "object / action"
 */
export function formatPermission(object: string, action: string): string {
  return `${object} / ${action}`;
}

// Re-export formatRoleName from normalizeRoles
export { formatRoleName } from "./normalizeRoles";
