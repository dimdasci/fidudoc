/**
 * Users API - HTTP contract definitions
 *
 * Defines the HTTP endpoints for the Users bounded context
 */

import type { User, AuditLog } from "../Domain/types.ts";

export const UsersEndpoints = {
  LIST: "list_users",
  CREATE: "create_user",
  UPDATE: "update_user",
  GET_AUDIT_LOG: "get_audit_log",
} as const;

export interface ListUsersResponse {
  total: number;
  users: User[];
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role: User["role"];
}

export interface CreateUserResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface UpdateUserRequest {
  name?: string;
  role?: User["role"];
  isActive?: boolean;
}

export interface UpdateUserResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface GetAuditLogRequest {
  userId?: string;
  action?: string;
  resourceType?: string;
}

export interface GetAuditLogResponse {
  total: number;
  auditLogs: AuditLog[];
}
