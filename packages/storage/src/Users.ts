/**
 * Users Service - Business capability for user management
 *
 * This service orchestrates user operations including creation, retrieval,
 * and updates. It's exposed at the top level to immediately communicate
 * this business capability.
 */

import { generateMockAuditLog, generateMockUsers } from "./Domain/mocks.ts";
import type { AuditLog, User } from "./Domain/types.ts";

export interface IUsers {
  listUsers: () => Promise<{ total: number; users: User[] }>;
  createUser: (data: CreateUserRequest) => Promise<CreateUserResponse>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<UpdateUserResponse>;
  getAuditLog: (
    filters?: AuditLogFilters,
  ) => Promise<{ total: number; auditLogs: AuditLog[] }>;
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

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
}

/**
 * In-memory implementation of Users service (mock)
 * In production, this would interact with a database via UsersRepo
 */
export function createUsersService(): IUsers {
  const mockUsers = generateMockUsers(8);
  const mockAuditLog = generateMockAuditLog();

  return {
    async listUsers() {
      return { total: mockUsers.length, users: mockUsers };
    },

    async createUser(data: CreateUserRequest) {
      const newUser: User = {
        id: `user-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        email: data.email,
        name: data.name,
        role: data.role,
        permissions: [],
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      return {
        success: true,
        message: "User created (mock - not persisted)",
        user: newUser,
      };
    },

    async updateUser(id: string, data: UpdateUserRequest) {
      const updatedUser: User = {
        id,
        email: "user@example.com",
        name: data.name || "Updated User",
        role: data.role || "operator",
        permissions: [],
        createdAt: new Date().toISOString(),
        isActive: data.isActive !== undefined ? data.isActive : true,
      };

      return {
        success: true,
        message: "User updated (mock - not persisted)",
        user: updatedUser,
      };
    },

    async getAuditLog(filters?: AuditLogFilters) {
      let filtered = [...mockAuditLog];

      if (filters?.userId) {
        filtered = filtered.filter((log) => log.userId === filters.userId);
      }

      if (filters?.action) {
        filtered = filtered.filter((log) => log.action === filters.action);
      }

      if (filters?.resourceType) {
        filtered = filtered.filter((log) =>
          log.resourceType === filters.resourceType
        );
      }

      return { total: filtered.length, auditLogs: filtered };
    },
  };
}
