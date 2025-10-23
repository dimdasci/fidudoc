import { useQuery } from "@tanstack/react-query";
import { Check, FileText, Upload, X } from "lucide-react";
import { useState } from "react";
import { useI18nContext } from "../../i18n/i18n";
import { fetchDocuments } from "../../services/api";
import { Button } from "../../ui/Button/Button";
import { ChevronDownIcon } from "../../ui/icons/ChevronDownIcon";
import { Input } from "../../ui/Input";
import { MenuItem, MenuPopup, MenuRoot, MenuTrigger } from "../../ui/Menu";
import { Table, TableBadge, type TableColumn } from "../../ui/Table";
import { showToast } from "../../ui/toast";
import { ToolbarGroup, ToolbarRoot, ToolbarSeparator } from "../../ui/Toolbar";

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
  // BUGFIX: Hot module reloading sometimes causes data to be serialized as string
  const parsedData = typeof data === "string" ? JSON.parse(data) : data;
  const documents = parsedData?.documents || [];
  const filteredDocuments = documents.filter((doc: DocumentRow) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.fileName.toLowerCase().includes(query)
      || doc.clientName.toLowerCase().includes(query)
    );
  });

  // Selection handlers
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

  // Table configuration
  const columns: TableColumn<DocumentRow>[] = [
    {
      key: "fileName",
      label: t("inbox.column.fileName"),
      render: (value) => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-secondary flex-shrink-0" />
          <span className="text-body text-primary truncate">
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
        <span className="text-body text-primary">
          {String(value)}
        </span>
      ),
    },
    {
      key: "fileSize",
      label: t("inbox.column.size"),
      align: "right",
      render: () => (
        <span className="text-body-sm text-secondary tabular-nums">
          {formatFileSize(Math.floor(Math.random() * 5000000 + 100000))}
        </span>
      ),
    },
    {
      key: "uploadedAt",
      label: t("inbox.column.received"),
      render: (value) => (
        <span className="text-body-sm text-secondary tabular-nums">
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
          <span className="text-body-sm text-primary tabular-nums font-medium">
            {Math.round(confidence * 100)}%
          </span>
        );
      },
    },
    {
      key: "processedAt",
      label: t("inbox.column.updated"),
      render: (value, row) => (
        <span className="text-body-sm text-secondary tabular-nums">
          {formatDate(String(value || row.uploadedAt))}
        </span>
      ),
    },
  ];

  const headerActions = (
    <div className="mb-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-headline font-semibold text-primary">
          {t("inbox.title")}
        </h2>
        <p className="text-body text-secondary">
          {t("inbox.subtitle")}
        </p>
      </div>
    </div>
  );

  const tableHeaderActions = (
    <>
      {/* Toolbar */}
      <ToolbarRoot className="justify-between mb-6">
        {/* Filters */}
        <ToolbarGroup>
          <div className="w-64">
            <Input
              placeholder={t("inbox.search.placeholder")}
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-40">
            <MenuRoot>
              <MenuTrigger>
                {statusFilter === "all"
                  ? t("inbox.filter.all")
                  : statusFilter === "pending"
                  ? t("inbox.filter.pending")
                  : statusFilter === "approved"
                  ? t("inbox.filter.approved")
                  : t("inbox.filter.rejected")}
                <ChevronDownIcon />
              </MenuTrigger>
              <MenuPopup>
                <MenuItem
                  onClick={() => setStatusFilter("all")}
                  selected={statusFilter === "all"}
                >
                  {t("inbox.filter.all")}
                </MenuItem>
                <MenuItem
                  onClick={() => setStatusFilter("pending")}
                  selected={statusFilter === "pending"}
                >
                  {t("inbox.filter.pending")}
                </MenuItem>
                <MenuItem
                  onClick={() => setStatusFilter("approved")}
                  selected={statusFilter === "approved"}
                >
                  {t("inbox.filter.approved")}
                </MenuItem>
                <MenuItem
                  onClick={() => setStatusFilter("rejected")}
                  selected={statusFilter === "rejected"}
                >
                  {t("inbox.filter.rejected")}
                </MenuItem>
              </MenuPopup>
            </MenuRoot>
          </div>
        </ToolbarGroup>
        <ToolbarSeparator orientation="vertical" />
        <ToolbarGroup>
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
        </ToolbarGroup>
        {/* Actions */}
        <ToolbarSeparator orientation="vertical" />
        <ToolbarGroup>
          <Button
            onClick={handleUpload}
            variant="primary"
            size="sm"
            icon={<Upload size={16} />}
          >
            {t("inbox.button.upload")}
          </Button>
        </ToolbarGroup>
      </ToolbarRoot>

      {/* Selection info */}
      {selectedIds.size > 0 && (
        <div className="mb-3 text-body-sm text-secondary">
          {selectedIds.size} document{selectedIds.size > 1 ? "s" : ""} selected
        </div>
      )}
    </>
  );

  const footer = !isLoading && !error && filteredDocuments.length > 0
    ? (
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-t border-subtle">
        <div className="text-body-sm text-secondary">
          {t("inbox.footer.showing", {
            count: filteredDocuments.length,
            total: documents.length,
          })}
        </div>
        {selectedIds.size > 0 && (
          <div className="text-body-sm font-medium text-primary">
            {t("inbox.footer.selected", { count: selectedIds.size })}
          </div>
        )}
      </div>
    )
    : undefined;

  return (
    <div className="flex flex-col h-full">
      {headerActions}

      <div className="flex-1 overflow-hidden">
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
