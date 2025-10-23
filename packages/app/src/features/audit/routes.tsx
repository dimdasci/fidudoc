import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronDown, ChevronUp, Loader } from "lucide-react";
import React, { useState } from "react";
import { useI18nContext } from "../../i18n/i18n";
import { fetchAuditLog } from "../../services/api";
import { Button } from "../../ui/Button/Button";

// Helper functions
function formatDateTime(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

interface AuditLogRow {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: unknown;
  [key: string]: unknown;
}

// Main Audit Route Component
export function AuditRoute() {
  const { t } = useI18nContext();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["auditLog"],
    queryFn: () => fetchAuditLog(),
  });

  const auditLogs = (data?.auditLogs || []) as unknown as AuditLogRow[];

  const toggleDetails = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const headerActions = (
    <div className="mb-6">
      <div className="space-y-1">
        <h2 className="text-headline font-semibold text-primary">
          {t("admin.audit")}
        </h2>
        <p className="text-body text-secondary">
          View system activity and user actions
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {headerActions}

      <div className="flex-1 overflow-hidden">
        <div className="bg-surface border border-subtle rounded-lg overflow-hidden h-full">
          {isLoading
            ? (
              <div className="flex items-center justify-center gap-3 py-12 h-full">
                <Loader size={20} className="animate-spin text-secondary" />
                <span className="text-body text-secondary">Loading audit log...</span>
              </div>
            )
            : error
            ? (
              <div className="flex items-center justify-center gap-3 py-12 h-full">
                <AlertCircle size={20} className="text-error" />
                <span className="text-body text-error">
                  Error loading audit log. Please try again.
                </span>
              </div>
            )
            : auditLogs.length === 0
            ? (
              <div className="flex items-center justify-center py-12 h-full">
                <span className="text-body text-secondary">
                  No audit entries found
                </span>
              </div>
            )
            : (
              <div className="flex flex-col h-full">
                {/* Fixed header */}
                <div className="flex-shrink-0">
                  <table className="w-full">
                    <thead className="bg-surface">
                      <tr className="border-b border-subtle">
                        <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                          {t("admin.col.timestamp")}
                        </th>
                        <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                          {t("admin.col.user")}
                        </th>
                        <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                          {t("admin.col.action")}
                        </th>
                        <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                          {t("admin.col.resource")}
                        </th>
                        <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                          {t("admin.col.details")}
                        </th>
                      </tr>
                    </thead>
                  </table>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sr-only">
                      <tr>
                        <th className="px-4 py-3">{t("admin.col.timestamp")}</th>
                        <th className="px-4 py-3">{t("admin.col.user")}</th>
                        <th className="px-4 py-3">{t("admin.col.action")}</th>
                        <th className="px-4 py-3">{t("admin.col.resource")}</th>
                        <th className="px-4 py-3">{t("admin.col.details")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <React.Fragment key={log.id}>
                          <tr className="border-b border-subtle last:border-b-0 hover:bg-neutral-bg transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-body-sm text-secondary tabular-nums">
                                {formatDateTime(log.timestamp)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-body-sm text-primary">
                                {log.userName}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-body-sm text-primary">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <span className="text-body-sm text-primary block">
                                  {log.resourceType}
                                </span>
                                <span className="text-body-sm text-secondary">
                                  {log.resourceId}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                onClick={() => toggleDetails(log.id)}
                                variant="ghost"
                                size="sm"
                                icon={expandedRow === log.id
                                  ? <ChevronUp size={14} />
                                  : <ChevronDown size={14} />}
                              >
                                {expandedRow === log.id ? "Hide" : "Show"}
                              </Button>
                            </td>
                          </tr>
                          {expandedRow === log.id && (
                            <tr key={`${log.id}-details`}>
                              <td
                                colSpan={5}
                                className="px-4 py-3 border-b border-subtle bg-neutral-bg"
                              >
                                <pre className="text-body-sm text-secondary whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
