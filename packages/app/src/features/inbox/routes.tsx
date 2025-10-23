import { useQuery } from "@tanstack/react-query";
import { Check, Clock, FileText, Loader, Upload, X } from "lucide-react";
import { useState } from "react";
import { useI18nContext } from "../../i18n/i18n";
import { fetchDocuments } from "../../services/api";
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Select,
  showToast,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "../../ui/primitives";

// Color system
const colors = {
  light: {
    bg: "#f9fafb",
    bgSecondary: "#ffffff",
    text: "#111827",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    green: "#15803d",
    amber: "#f59e0b",
    red: "#ef4444",
    blueLight: "#eff6ff",
  },
  dark: {
    bg: "#111827",
    bgSecondary: "#1f2937",
    text: "#f3f4f6",
    textSecondary: "#9ca3af",
    border: "#374151",
    green: "#22c55e",
    amber: "#fbbf24",
    red: "#f87171",
    blueLight: "#0f172a",
  },
};

const isDark = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const getColors = () => (isDark() ? colors.dark : colors.light);

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

function getStatusBadgeVariant(
  status: string,
): "success" | "warning" | "error" | "default" {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "error";
    default:
      return "default";
  }
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

export function InboxRoute() {
  const { t } = useI18nContext();
  const c = getColors();

  // State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch documents
  const { data, isLoading, error } = useQuery({
    queryKey: ["documents", statusFilter],
    queryFn: () =>
      fetchDocuments(
        statusFilter !== "all" ? { status: statusFilter } : undefined,
      ),
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
  });

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

  const handleRowClick = (id: string) => {
    const isSelected = selectedIds.has(id);
    handleSelectOne(id, !isSelected);
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

  // Render
  const allSelected = filteredDocuments.length > 0
    && filteredDocuments.every((doc) => selectedIds.has(doc.id));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: 700,
            color: c.text,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {t("inbox.title")}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: c.textSecondary,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {t("inbox.subtitle")}
        </p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        {/* Left side - Actions */}
        <div style={{ display: "flex", gap: "8px", flex: "1 1 auto" }}>
          <Button variant="primary" size="sm" onClick={handleUpload}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Upload size={16} />
              {t("inbox.button.upload")}
            </div>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleApprove}
            disabled={selectedIds.size === 0}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Check size={16} />
              {t("inbox.button.approve")}
            </div>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReject}
            disabled={selectedIds.size === 0}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <X size={16} />
              {t("inbox.button.reject")}
            </div>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDefer}
            disabled={selectedIds.size === 0}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={16} />
              {t("inbox.button.defer")}
            </div>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSaveMetadata}
            disabled={selectedIds.size === 0}
          >
            {t("inbox.button.saveMetadata")}
          </Button>
        </div>

        {/* Right side - Filters */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            flex: "0 0 auto",
            minWidth: "300px",
          }}
        >
          <div style={{ flex: "1 1 auto", minWidth: "150px" }}>
            <Input
              placeholder={t("inbox.search.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ flex: "0 0 auto", minWidth: "140px" }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                {
                  value: "all",
                  label: t("inbox.filter.all"),
                },
                {
                  value: "pending",
                  label: t("inbox.filter.pending"),
                },
                {
                  value: "approved",
                  label: t("inbox.filter.approved"),
                },
                {
                  value: "rejected",
                  label: t("inbox.filter.rejected"),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          background: c.bgSecondary,
          border: `1px solid ${c.border}`,
          borderRadius: "8px",
        }}
      >
        {isLoading
          ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px",
                color: c.textSecondary,
                fontFamily: "Inter, sans-serif",
              }}
            >
              <Loader
                size={24}
                style={{ animation: "spin 1s linear infinite" }}
              />
              <span style={{ marginLeft: "12px" }}>
                {t("inbox.loading")}
              </span>
              <style>
                {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
              </style>
            </div>
          )
          : error
          ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px",
                color: c.red,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {t("inbox.error")}
            </div>
          )
          : filteredDocuments.length === 0
          ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px",
                color: c.textSecondary,
                fontFamily: "Inter, sans-serif",
              }}
            >
              <FileText size={24} style={{ marginRight: "12px" }} />
              {t("inbox.empty")}
            </div>
          )
          : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header width="40px">
                    <Checkbox
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ margin: 0 }}
                    />
                  </TableCell>
                  <TableCell header>{t("inbox.column.fileName")}</TableCell>
                  <TableCell header>{t("inbox.column.type")}</TableCell>
                  <TableCell header>{t("inbox.column.status")}</TableCell>
                  <TableCell header>{t("inbox.column.client")}</TableCell>
                  <TableCell header numeric>{t("inbox.column.size")}</TableCell>
                  <TableCell header>{t("inbox.column.received")}</TableCell>
                  <TableCell header numeric>
                    {t("inbox.column.confidence")}
                  </TableCell>
                  <TableCell header>{t("inbox.column.updated")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow
                    key={doc.id}
                    onClick={() => handleRowClick(doc.id)}
                    selected={selectedIds.has(doc.id)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(doc.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectOne(doc.id, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ margin: 0 }}
                      />
                    </TableCell>
                    <TableCell>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FileText size={16} style={{ color: c.textSecondary }} />
                        <span
                          style={{
                            fontWeight: 500,
                            fontFamily: "Inter, sans-serif",
                          }}
                        >
                          {doc.fileName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {getDocumentTypeLabel(doc.documentType, t)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(doc.status)}>
                        {doc.status === "pending"
                          ? t("inbox.status.pending")
                          : doc.status === "approved"
                          ? t("inbox.status.approved")
                          : t("inbox.status.rejected")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontFamily: "Inter, sans-serif" }}>
                        {doc.clientName}
                      </span>
                    </TableCell>
                    <TableCell numeric>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          color: c.textSecondary,
                        }}
                      >
                        {formatFileSize(
                          Math.floor(Math.random() * 5000000 + 100000),
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          color: c.textSecondary,
                        }}
                      >
                        {formatDate(doc.uploadedAt)}
                      </span>
                    </TableCell>
                    <TableCell numeric>
                      <span
                        style={{
                          fontWeight: 500,
                          fontFamily: "Inter, sans-serif",
                          color: doc.confidence >= 0.8
                            ? c.green
                            : doc.confidence >= 0.6
                            ? c.amber
                            : c.red,
                        }}
                      >
                        {Math.round(doc.confidence * 100)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          color: c.textSecondary,
                        }}
                      >
                        {formatDate(doc.processedAt || doc.uploadedAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </div>

      {/* Footer Info */}
      {!isLoading && !error && filteredDocuments.length > 0 && (
        <div
          style={{
            marginTop: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "13px",
            color: c.textSecondary,
            fontFamily: "Inter, sans-serif",
          }}
        >
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
      )}
    </div>
  );
}
