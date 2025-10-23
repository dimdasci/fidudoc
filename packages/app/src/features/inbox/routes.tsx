import { Checkbox as BaseCheckbox } from "@base-ui-components/react/checkbox";
import { Input as BaseInput } from "@base-ui-components/react/input";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock, FileText, Upload, X } from "lucide-react";
import { useState } from "react";
import { useI18nContext } from "../../i18n/i18n";
import { fetchDocuments } from "../../services/api";
import { Button } from "../../ui/Button";
import { Select } from "../../ui/Select";
import { Table, TableBadge, type TableColumn } from "../../ui/Table";
import { showToast } from "../../ui/toast";

// Helper functions
function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateString: string): string {
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

function getDocumentTypeLabel(type: string, t: (key: string) => string): string {
  const typeMap: Record<string, string> = {
    invoice: "inbox.documentType.invoice",
    receipt: "inbox.documentType.receipt",
    contract: "inbox.documentType.contract",
    lease: "inbox.documentType.lease",
    tax_return: "inbox.documentType.taxReturn",
    unknown: "inbox.documentType.unknown",
  };

  const key = typeMap[type];
  return key ? t(key) : type;
}

interface DocumentRow {
  id: string;
  fileName: string;
  documentType: string;
  status: string;
  clientName: string;
  uploadedAt: string;
  confidence: number;
  processedAt?: string;
  [key: string]: unknown;
}

export function InboxRoute() {
  const { t } = useI18nContext();

  // State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch documents
  const { data, isLoading, error } = useQuery({
    queryKey: ["documents", statusFilter],
    queryFn: () => {
      const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
      return fetchDocuments(params);
    },
  });

  // Filter documents based on search query
  const documents = data?.documents || [];
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.fileName.toLowerCase().includes(query)
      || doc.clientName.toLowerCase().includes(query)
    );
  }) as unknown as DocumentRow[];

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredDocuments.map((doc) => doc.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleRowClick = (row: DocumentRow) => {
    const isSelected = selectedIds.has(row.id);
    handleSelectOne(row.id, !isSelected);
  };

  // Action handlers
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
    setSelectedIds(new Set());
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
    setSelectedIds(new Set());
  };

  const handleDefer = () => {
    if (selectedIds.size === 0) {
      showToast(t("inbox.toast.noSelection"), "error");
      return;
    }
    showToast(
      t("inbox.toast.deferSuccess", { count: selectedIds.size }),
      "success",
    );
    setSelectedIds(new Set());
  };

  const handleSaveMetadata = () => {
    if (selectedIds.size === 0) {
      showToast(t("inbox.toast.noSelection"), "error");
      return;
    }
    showToast(
      t("inbox.toast.metadataSaved", { count: selectedIds.size }),
      "success",
    );
  };

  // Table configuration
  const allSelected = filteredDocuments.length > 0
    && filteredDocuments.every((doc) => selectedIds.has(doc.id));

  const columns: TableColumn<DocumentRow>[] = [
    {
      key: "select",
      label: "",
      width: "40px",
      render: (_, row) => (
        <BaseCheckbox.Root
          checked={selectedIds.has(row.id)}
          onCheckedChange={(checked) => {
            handleSelectOne(row.id, checked);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <BaseCheckbox.Indicator>
            <Check size={14} strokeWidth={3} />
          </BaseCheckbox.Indicator>
        </BaseCheckbox.Root>
      ),
    },
    {
      key: "fileName",
      label: t("inbox.column.fileName"),
      render: (value) => (
        <div>
          <FileText size={16} />
          <span>
            {String(value)}
          </span>
        </div>
      ),
    },
    {
      key: "documentType",
      label: t("inbox.column.type"),
      render: (value) => (
        <TableBadge variant="default">
          {getDocumentTypeLabel(String(value), t)}
        </TableBadge>
      ),
    },
    {
      key: "status",
      label: t("inbox.column.status"),
      render: (value) => {
        const status = String(value);
        const variant = status === "pending"
          ? "warning"
          : status === "approved"
          ? "success"
          : "error";
        const label = status === "pending"
          ? t("inbox.status.pending")
          : status === "approved"
          ? t("inbox.status.approved")
          : t("inbox.status.rejected");
        return <TableBadge variant={variant}>{label}</TableBadge>;
      },
    },
    {
      key: "clientName",
      label: t("inbox.column.client"),
      render: (value) => (
        <span>
          {String(value)}
        </span>
      ),
    },
    {
      key: "fileSize",
      label: t("inbox.column.size"),
      align: "right",
      render: () => (
        <span>
          {formatFileSize(Math.floor(Math.random() * 5000000 + 100000))}
        </span>
      ),
    },
    {
      key: "uploadedAt",
      label: t("inbox.column.received"),
      render: (value) => (
        <span>
          {formatDate(String(value))}
        </span>
      ),
    },
    {
      key: "confidence",
      label: t("inbox.column.confidence"),
      align: "right",
      render: (value, _row) => {
        const confidence = Number(value);
        return (
          <span>
            {Math.round(confidence * 100)}%
          </span>
        );
      },
    },
    {
      key: "processedAt",
      label: t("inbox.column.updated"),
      render: (value, row) => (
        <span>
          {formatDate(String(value || row.uploadedAt))}
        </span>
      ),
    },
  ];

  const headerActions = (
    <div>
      {/* Header */}
      <div>
        <h2>
          {t("inbox.title")}
        </h2>
        <p>
          {t("inbox.subtitle")}
        </p>
      </div>
    </div>
  );

  const tableHeaderActions = (
    <>
      {/* Toolbar */}
      <div>
        {/* Left side - Actions */}
        <div>
          <Button
            onClick={handleUpload}
            variant="primary"
            size="sm"
            icon={<Upload size={16} />}
          >
            {t("inbox.button.upload")}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={selectedIds.size === 0}
            variant="secondary"
            size="sm"
            icon={<Check size={16} />}
          >
            {t("inbox.button.approve")}
          </Button>
          <Button
            onClick={handleReject}
            disabled={selectedIds.size === 0}
            variant="secondary"
            size="sm"
            icon={<X size={16} />}
          >
            {t("inbox.button.reject")}
          </Button>
          <Button
            onClick={handleDefer}
            disabled={selectedIds.size === 0}
            variant="secondary"
            size="sm"
            icon={<Clock size={16} />}
          >
            {t("inbox.button.defer")}
          </Button>
          <Button
            onClick={handleSaveMetadata}
            disabled={selectedIds.size === 0}
            variant="secondary"
            size="sm"
          >
            {t("inbox.button.saveMetadata")}
          </Button>
        </div>

        {/* Right side - Filters */}
        <div>
          <div>
            <BaseInput
              placeholder={t("inbox.search.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: t("inbox.filter.all") },
                { value: "pending", label: t("inbox.filter.pending") },
                { value: "approved", label: t("inbox.filter.approved") },
                { value: "rejected", label: t("inbox.filter.rejected") },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Select All Header */}
      <div>
        <BaseCheckbox.Root
          checked={allSelected}
          onCheckedChange={(checked) => handleSelectAll(checked)}
        >
          <BaseCheckbox.Indicator>
            <Check size={14} strokeWidth={3} />
          </BaseCheckbox.Indicator>
        </BaseCheckbox.Root>
        <span>
          Select All
        </span>
      </div>
    </>
  );

  const footer = !isLoading && !error && filteredDocuments.length > 0
    ? (
      <div>
        <div>
          {t("inbox.footer.showing", {
            count: filteredDocuments.length,
            total: documents.length,
          })}
        </div>
        {selectedIds.size > 0 && (
          <div>{t("inbox.footer.selected", { count: selectedIds.size })}</div>
        )}
      </div>
    )
    : undefined;

  return (
    <div>
      {headerActions}

      <div>
        <Table
          columns={columns}
          data={filteredDocuments}
          loading={isLoading}
          error={error ? t("inbox.error") : null}
          emptyMessage={t("inbox.empty")}
          loadingMessage={t("inbox.loading")}
          onRowClick={handleRowClick}
          headerActions={tableHeaderActions}
          footer={footer}
        />
      </div>
    </div>
  );
}
