import type { RoleWithStats } from "../api/roles.types";
import { ROLES } from "./constants";

/**
 * Ensures required system roles (admin, user) are always present in the roles list.
 * - Keeps ALL existing backend roles as-is (no renaming)
 * - Makes role names case-insensitive (Admin, ADMIN -> admin)
 * - Adds "admin" and "user" if they don't exist in the backend response
 */
export function normalizeRoles(backendRoles: RoleWithStats[]): RoleWithStats[] {
  // Create a map for case-insensitive lookup
  const roleMap = new Map<string, RoleWithStats>();

  // Process all backend roles - normalize to lowercase but keep ALL roles
  for (const role of backendRoles) {
    const normalizedName = role.role.toLowerCase().trim();

    // If we already have this role (case-insensitive), merge the stats
    const existing = roleMap.get(normalizedName);
    if (existing) {
      roleMap.set(normalizedName, {
        ...existing,
        permissionCount: existing.permissionCount + role.permissionCount,
        userCount: existing.userCount + role.userCount,
      });
    } else {
      // Add the role with normalized name
      roleMap.set(normalizedName, {
        ...role,
        role: normalizedName,
      });
    }
  }

  // Ensure required system roles (admin, user) exist
  for (const requiredRole of ROLES) {
    if (!roleMap.has(requiredRole)) {
      // Add missing system role with zero stats
      roleMap.set(requiredRole, {
        id: `generated-${requiredRole}`,
        role: requiredRole,
        permissionCount: 0,
        userCount: 0,
      });
    }
  }

  // Return all roles (system + backend)
  return Array.from(roleMap.values());
}

/**
 * Formats role name for display (capitalize first letter)
 */
export function formatRoleName(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
