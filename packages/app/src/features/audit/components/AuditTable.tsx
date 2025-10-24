import type { AuditLog } from "@features/audit/api/audit.api";
import { formatDateTime } from "@features/audit/lib/formatters";
import { Button } from "@shared/ui/Button/Button";
import { AlertCircle, ChevronDown, ChevronUp, Loader } from "lucide-react";
import { Fragment, useState } from "react";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface AuditTableProps {
  logs: AuditLog[];
  loading: boolean;
  error: boolean;
  t: TranslateFn;
}

export function AuditTable({ logs, loading, error, t }: AuditTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleDetails = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 h-full">
        <Loader size={20} className="animate-spin text-secondary" />
        <span className="text-body text-secondary">
          {t("audit.loading")}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center gap-3 py-12 h-full">
        <AlertCircle size={20} className="text-error" />
        <span className="text-body text-error">
          {t("audit.error")}
        </span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 h-full">
        <span className="text-body text-secondary">
          {t("audit.empty")}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <table className="w-full">
          <thead className="bg-surface">
            <tr className="border-b border-subtle">
              <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                {t("audit.table.timestamp")}
              </th>
              <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                {t("audit.table.user")}
              </th>
              <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                {t("audit.table.action")}
              </th>
              <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                {t("audit.table.resource")}
              </th>
              <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                {t("audit.table.details")}
              </th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="sr-only">
            <tr>
              <th className="px-4 py-3">{t("audit.table.timestamp")}</th>
              <th className="px-4 py-3">{t("audit.table.user")}</th>
              <th className="px-4 py-3">{t("audit.table.action")}</th>
              <th className="px-4 py-3">{t("audit.table.resource")}</th>
              <th className="px-4 py-3">{t("audit.table.details")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <Fragment key={log.id}>
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
                      {expandedRow === log.id
                        ? t("audit.actions.hide")
                        : t("audit.actions.show")}
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
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
