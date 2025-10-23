import { useQuery } from "@tanstack/react-query";
import { listAuditLogs, type AuditLogResponse } from "@features/audit/api/audit.api";

export function useAuditLogs() {
  const queryResult = useQuery({
    queryKey: ["auditLog"],
    queryFn: listAuditLogs,
  });

  const data = normalizeResponse(queryResult.data);

  return {
    auditLogs: data?.auditLogs ?? [],
    total: data?.total ?? 0,
    queryResult,
  };
}

function normalizeResponse(
  data: AuditLogResponse | string | undefined,
): AuditLogResponse | undefined {
  if (!data) return undefined;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as AuditLogResponse;
    } catch {
      return undefined;
    }
  }
  return data;
}
