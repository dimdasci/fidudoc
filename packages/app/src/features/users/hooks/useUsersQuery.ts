import { listUsers, type ListUsersResponse } from "@features/users/api/users.api";
import { useQuery } from "@tanstack/react-query";

export function useUsersQuery(accountId: string | null) {
  const queryResult = useQuery({
    queryKey: ["users", accountId],
    queryFn: () => {
      if (!accountId) throw new Error("Account ID is required");
      return listUsers(accountId);
    },
    enabled: !!accountId,
  });

  const data = normalizeResponse(queryResult.data);

  return {
    users: data?.users ?? [],
    total: data?.total ?? 0,
    queryResult,
  };
}

function normalizeResponse(
  data: ListUsersResponse | string | undefined,
): ListUsersResponse | undefined {
  if (!data) return undefined;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as ListUsersResponse;
    } catch {
      return undefined;
    }
  }
  return data;
}
