import {
  listDocuments,
  type ListDocumentsParams,
  type ListDocumentsResponse,
} from "@features/inbox/api/documents.api";
import { useQuery } from "@tanstack/react-query";

export interface UseDocumentsQueryOptions {
  status?: string;
}

function parseResponse(
  data: ListDocumentsResponse | string | undefined,
): ListDocumentsResponse | undefined {
  if (!data) return undefined;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as ListDocumentsResponse;
    } catch {
      return undefined;
    }
  }
  return data;
}

export function useDocumentsQuery({ status }: UseDocumentsQueryOptions) {
  const params: ListDocumentsParams | undefined = status && status !== "all"
    ? { status }
    : undefined;

  const queryResult = useQuery({
    queryKey: ["documents", params?.status ?? "all"],
    queryFn: () => listDocuments(params),
  });

  const parsed = parseResponse(queryResult.data);

  return {
    documents: parsed?.documents ?? [],
    total: parsed?.total ?? 0,
    queryResult,
  };
}
