import type { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Fetches fresh data with optional cache-busting and applies it to the query cache.
 * Falls back to invalidating the query if the fetch fails.
 */
export async function refreshQueryWithFreshData<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  fetchFresh: () => Promise<T>,
) {
  try {
    const freshData = await fetchFresh();
    queryClient.setQueryData(queryKey, freshData);
    return { success: true as const };
  } catch (error) {
    queryClient.invalidateQueries({ queryKey, exact: true });
    return { success: false as const, error };
  }
}
