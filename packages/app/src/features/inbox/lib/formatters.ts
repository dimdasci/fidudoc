import { DOCUMENT_STATUS_META, DOCUMENT_TYPE_LABEL_MAP } from "./constants";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function formatFileSize(bytes: number): string {
  if (!bytes && bytes !== 0) return "0 B";
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const normalizedIndex = Math.min(i, sizes.length - 1);
  const sizeInUnit = bytes / k ** normalizedIndex;

  return `${sizeInUnit.toFixed(1)} ${sizes[normalizedIndex]}`;
}

export function formatDateTime(dateString: string): string {
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

export function getDocumentTypeLabel(type: string, t: TranslateFn): string {
  const key = DOCUMENT_TYPE_LABEL_MAP[type];
  return key ? t(key) : type;
}

export function getDocumentStatusMeta(status: string, t: TranslateFn) {
  const meta = DOCUMENT_STATUS_META[status];
  if (!meta) {
    return {
      colorClass: "text-secondary",
      label: status,
    };
  }

  return {
    colorClass: meta.colorClass,
    label: t(meta.labelKey),
  };
}
