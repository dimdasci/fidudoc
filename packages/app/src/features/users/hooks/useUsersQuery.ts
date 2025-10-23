import { listUsers, type ListUsersResponse } from "@features/users/api/users.api";
import { useQuery } from "@tanstack/react-query";

export function useUsersQuery() {
  const queryResult = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
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
