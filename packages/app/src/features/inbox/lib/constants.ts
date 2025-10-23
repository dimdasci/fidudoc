export const DOCUMENT_TYPE_LABEL_MAP: Record<string, string> = {
  invoice: "inbox.documentType.invoice",
  receipt: "inbox.documentType.receipt",
  contract: "inbox.documentType.contract",
  lease: "inbox.documentType.lease",
  tax_return: "inbox.documentType.taxReturn",
  unknown: "inbox.documentType.unknown",
};

export const DOCUMENT_STATUS_META: Record<
  string,
  { colorClass: string; labelKey: string }
> = {
  pending: {
    colorClass: "text-warning",
    labelKey: "inbox.status.pending",
  },
  approved: {
    colorClass: "text-success",
    labelKey: "inbox.status.approved",
  },
  rejected: {
    colorClass: "text-error",
    labelKey: "inbox.status.rejected",
  },
};
