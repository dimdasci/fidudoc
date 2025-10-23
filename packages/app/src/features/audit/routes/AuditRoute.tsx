import { AuditHeader } from "@features/audit/components/AuditHeader";
import { AuditTable } from "@features/audit/components/AuditTable";
import { useAuditLogs } from "@features/audit/hooks/useAuditLogs";
import { useI18nContext } from "@shared/i18n/i18n";

export function AuditRoute() {
  const { t } = useI18nContext();
  const { auditLogs, queryResult } = useAuditLogs();

  return (
    <div className="flex flex-col h-full">
      <AuditHeader t={t} />

      <div className="flex-1 overflow-hidden">
        <div className="bg-surface border border-subtle rounded-lg overflow-hidden h-full">
          <AuditTable
            logs={auditLogs}
            loading={queryResult.isLoading}
            error={Boolean(queryResult.error)}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
