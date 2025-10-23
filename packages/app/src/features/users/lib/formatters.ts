import { USER_ROLE_META } from "./constants";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function formatDateTime(dateString: string | undefined): string {
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

export function getRoleMeta(role: string, t: TranslateFn) {
  const meta = USER_ROLE_META[role];
  if (!meta) {
    return {
      colorClass: "text-secondary",
      label: role,
    };
  }

  return {
    colorClass: meta.colorClass,
    label: t(meta.labelKey),
  };
}
