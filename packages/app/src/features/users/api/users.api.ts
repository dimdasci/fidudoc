import { fetchWithAuth } from "@shared/lib/http/client";
import type { User } from "@shared/services/api";

export type { User };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ============================================================================
// Type Definitions
// ============================================================================

export interface ListUsersResponse {
  total: number;
  users: User[];
}

export interface CreateUserData {
  email: string;
  displayName: string;
  fullName: string;
  isActive: boolean;
  title?: string;
}

export interface UpdateUserData {
  email?: string;
  displayName?: string;
  fullName?: string;
  isActive?: boolean;
  title?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * List all users in an account
 */
export async function listUsers(
  accountId: string,
  bustCache = false,
): Promise<ListUsersResponse> {
  const url = `${API_BASE_URL}/accounts/${accountId}/users`;
  // Add cache-busting timestamp when needed to bypass backend deduplication
  const finalUrl = bustCache ? `${url}?t=${Date.now()}` : url;
  const res = await fetchWithAuth(finalUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Create a new user
 */
export async function createUser(
  accountId: string,
  data: CreateUserData,
): Promise<User> {
  const url = `${API_BASE_URL}/accounts/${accountId}/users`;
  const res = await fetchWithAuth(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const response = await res.json();
  return response.user;
}

/**
 * Update an existing user
 */
export async function updateUser(
  accountId: string,
  userId: string,
  data: UpdateUserData,
): Promise<User> {
  const url = `${API_BASE_URL}/accounts/${accountId}/users/${userId}`;
  const res = await fetchWithAuth(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const response = await res.json();
  return response.user;
}
