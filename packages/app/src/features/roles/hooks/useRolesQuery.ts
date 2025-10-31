import { useQuery } from "@tanstack/react-query";
import { fetchRoles } from "../api/roles.api";
import { normalizeRoles } from "../lib/normalizeRoles";

/**
 * React Query hook to fetch roles with statistics.
 * Normalizes role names to lowercase and ensures admin/user are always present.
 */
export function useRolesQuery(accountId: string | null | undefined) {
  return useQuery({
    queryKey: ["roles", accountId],
    queryFn: async () => {
      if (!accountId) {
        throw new Error("Account id is required to fetch roles");
      }
      const response = await fetchRoles(accountId);
      return normalizeRoles(response.roles);
    },
    enabled: Boolean(accountId),
    staleTime: 30000, // 30 seconds
  });
}
