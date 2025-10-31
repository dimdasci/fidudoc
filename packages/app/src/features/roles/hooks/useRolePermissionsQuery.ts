import { useQuery } from "@tanstack/react-query";
import { fetchRolePermissions } from "../api/roles.api";

/**
 * React Query hook to fetch permissions for a specific role
 */
export function useRolePermissionsQuery(accountId: string, roleName: string) {
  return useQuery({
    queryKey: ["roles", accountId, roleName, "permissions"],
    queryFn: () => fetchRolePermissions(accountId, roleName),
    enabled: Boolean(accountId && roleName), // Only run when we have valid params
    staleTime: 30000, // 30 seconds
    retry: 3, // Retry failed requests
  });
}
