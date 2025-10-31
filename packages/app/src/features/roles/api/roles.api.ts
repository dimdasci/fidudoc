import { fetchWithAuth } from "@shared/lib/http/client";
import type {
  AddPermissionRequest,
  RemovePermissionRequest,
  RolePermissionsResponse,
  RoleWithStats,
} from "./roles.types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Fetch all roles with statistics (permission count, user count)
 */
export async function fetchRoles(
  accountId: string,
): Promise<{ roles: RoleWithStats[] }> {
  const url = `${API_BASE_URL}/accounts/${accountId}/roles?includeStats=true`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Fetch permissions for a specific role
 */
export async function fetchRolePermissions(
  accountId: string,
  roleName: string,
  bustCache = false,
): Promise<RolePermissionsResponse> {
  const url = `${API_BASE_URL}/accounts/${accountId}/roles/${roleName}/permissions`;
  // Add cache-busting timestamp when needed to bypass backend deduplication
  const finalUrl = bustCache ? `${url}?t=${Date.now()}` : url;
  const res = await fetchWithAuth(finalUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Add a permission to a role
 */
export async function addPermission(
  accountId: string,
  roleName: string,
  permission: AddPermissionRequest,
): Promise<{ success: boolean; message: string }> {
  const url = `${API_BASE_URL}/accounts/${accountId}/roles/${roleName}/permissions`;
  const res = await fetchWithAuth(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(permission),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Remove a permission from a role
 */
export async function removePermission(
  accountId: string,
  roleName: string,
  permission: RemovePermissionRequest,
): Promise<{ success: boolean; message: string }> {
  const url = `${API_BASE_URL}/accounts/${accountId}/roles/${roleName}/permissions`;
  const res = await fetchWithAuth(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(permission),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Assign a role to a user (creates grouping record)
 */
export async function assignRoleToUser(
  accountId: string,
  userId: string,
  roleName: string,
): Promise<{ success: boolean; userId: string; roleName: string; domain: string }> {
  const url =
    `${API_BASE_URL}/accounts/${accountId}/users/${userId}/roles/${roleName}`;
  const res = await fetchWithAuth(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Remove a role from a user (removes grouping record)
 */
export async function removeRoleFromUser(
  accountId: string,
  userId: string,
  roleName: string,
): Promise<{ success: boolean; userId: string; roleName: string; domain: string }> {
  const url =
    `${API_BASE_URL}/accounts/${accountId}/users/${userId}/roles/${roleName}`;
  const res = await fetchWithAuth(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Get all users assigned to a role
 */
export async function fetchUsersForRole(
  accountId: string,
  roleName: string,
  bustCache = false,
): Promise<
  { roleName: string; domain: string; users: string[]; includeInherited: boolean }
> {
  const url = `${API_BASE_URL}/accounts/${accountId}/roles/${roleName}/users`;
  // Add cache-busting timestamp when needed to bypass backend deduplication
  const finalUrl = bustCache ? `${url}?t=${Date.now()}` : url;
  const res = await fetchWithAuth(finalUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
