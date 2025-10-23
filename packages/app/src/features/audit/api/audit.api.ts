import type { AuditLog } from "@shared/services/api";
import { fetchAuditLog } from "@shared/services/api";

export type { AuditLog };

export interface AuditLogResponse {
  total: number;
  auditLogs: AuditLog[];
}

export async function listAuditLogs(): Promise<AuditLogResponse> {
  return fetchAuditLog();
}
