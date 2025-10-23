import type { User } from "@shared/services/api";
import { fetchUsers } from "@shared/services/api";

export type { User };

export interface ListUsersResponse {
  total: number;
  users: User[];
}

export function listUsers(): Promise<ListUsersResponse> {
  return fetchUsers();
}
