import { InboxFooter } from "@features/inbox/components/InboxFooter";
import { InboxHeader } from "@features/inbox/components/InboxHeader";
import type { InboxDocumentRow } from "@features/inbox/components/InboxTable";
import { InboxTable } from "@features/inbox/components/InboxTable";
import { InboxToolbar } from "@features/inbox/components/InboxToolbar";
import { useDocumentsQuery } from "@features/inbox/hooks/useDocumentsQuery";
import { useInboxSelection } from "@features/inbox/hooks/useInboxSelection";
import { useI18nContext } from "@shared/i18n/i18n";
import { showToast } from "@shared/ui/toast";
import { useMemo, useState } from "react";

export function InboxRoute() {
  const { t } = useI18nContext();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { documents, total, queryResult } = useDocumentsQuery({
    status: statusFilter,
  });

  const { selectedIds, toggleSelection, clearSelection } = useInboxSelection();

  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter((doc) => {
      const fileName = doc.fileName?.toLowerCase() ?? "";
      const clientName = doc.clientName?.toLowerCase() ?? "";
      return fileName.includes(query) || clientName.includes(query);
    });
  }, [documents, searchQuery]);

  const handleRowClick = (row: InboxDocumentRow) => {
    if (!row.id) return;
    toggleSelection(row.id);
  };

  const handleUpload = () => {
    showToast(t("inbox.toast.uploadSuccess"), "success");
  };

  const handleApprove = () => {
    if (selectedIds.size === 0) {
      showToast(t("inbox.toast.noSelection"), "error");
      return;
    }

    showToast(
      t("inbox.toast.approveSuccess", { count: selectedIds.size }),
      "success",
    );
    clearSelection();
  };

  const handleReject = () => {
    if (selectedIds.size === 0) {
      showToast(t("inbox.toast.noSelection"), "error");
      return;
    }

    showToast(
      t("inbox.toast.rejectSuccess", { count: selectedIds.size }),
      "success",
    );
    clearSelection();
  };

  const tableHeaderActions = (
    <InboxToolbar
      statusFilter={statusFilter}
      onStatusChange={setStatusFilter}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedCount={selectedIds.size}
      onApprove={handleApprove}
      onReject={handleReject}
      onUpload={handleUpload}
      t={t}
    />
  );

  const shouldShowFooter = !queryResult.isLoading
    && !queryResult.error
    && filteredDocuments.length > 0;

  const footer = shouldShowFooter
    ? (
      <InboxFooter
        visibleCount={filteredDocuments.length}
        totalCount={total}
        selectedCount={selectedIds.size}
        t={t}
      />
    )
    : undefined;

  return (
    <div className="flex flex-col h-full">
      <InboxHeader title={t("inbox.title")} subtitle={t("inbox.subtitle")} />

      <div className="flex-1 overflow-hidden">
        <InboxTable
          documents={filteredDocuments}
          loading={queryResult.isLoading}
          error={queryResult.error ? t("inbox.error") : null}
          emptyMessage={t("inbox.empty")}
          loadingMessage={t("inbox.loading")}
          onRowClick={handleRowClick}
          selectedRows={selectedIds}
          headerActions={tableHeaderActions}
          footer={footer}
          t={t}
        />
      </div>
    </div>
  );
}
