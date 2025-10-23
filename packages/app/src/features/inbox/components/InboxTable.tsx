import type { Document } from "@features/inbox/api/documents.api";
import {
  formatDateTime,
  formatFileSize,
  getDocumentStatusMeta,
  getDocumentTypeLabel,
} from "@features/inbox/lib/formatters";
import { Table, type TableColumn } from "@shared/ui/Table";
import type { ReactNode } from "react";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export type InboxDocumentRow = Document;

interface InboxTableProps {
  documents: InboxDocumentRow[];
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  loadingMessage: string;
  onRowClick: (row: InboxDocumentRow, index: number) => void;
  selectedRows: Set<string | number>;
  headerActions: ReactNode;
  footer?: ReactNode;
  t: TranslateFn;
}

export function InboxTable({
  documents,
  loading,
  error,
  emptyMessage,
  loadingMessage,
  onRowClick,
  selectedRows,
  headerActions,
  footer,
  t,
}: InboxTableProps) {
  const columns: TableColumn<InboxDocumentRow>[] = [
    {
      key: "fileName",
      label: t("inbox.column.fileName"),
      render: (value) => (
        <span className="text-body-sm text-primary truncate">
          {String(value)}
        </span>
      ),
    },
    {
      key: "documentType",
      label: t("inbox.column.type"),
      render: (value) => (
        <span className="text-body-sm text-primary">
          {getDocumentTypeLabel(String(value), t)}
        </span>
      ),
    },
    {
      key: "status",
      label: t("inbox.column.status"),
      render: (value) => {
        const status = String(value);
        const { colorClass, label } = getDocumentStatusMeta(status, t);
        return (
          <span className={`text-body-sm font-medium ${colorClass}`}>{label}</span>
        );
      },
    },
    {
      key: "clientName",
      label: t("inbox.column.client"),
      render: (value) => (
        <span className="text-body-sm text-primary">
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
          {formatDateTime(String(value))}
        </span>
      ),
    },
    {
      key: "confidence",
      label: t("inbox.column.confidence"),
      align: "right",
      render: (value) => {
        const confidence = Number(value);
        return (
          <span className="text-body-sm text-primary tabular-nums font-medium">
            {Number.isFinite(confidence) ? Math.round(confidence * 100) : 0}%
          </span>
        );
      },
    },
    {
      key: "processedAt",
      label: t("inbox.column.updated"),
      render: (value, row) => (
        <span className="text-body-sm text-secondary tabular-nums">
          {formatDateTime(String(value || row.uploadedAt))}
        </span>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={documents}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
      loadingMessage={loadingMessage}
      onRowClick={onRowClick}
      headerActions={headerActions}
      footer={footer}
      selectedRows={selectedRows}
    />
  );
}
