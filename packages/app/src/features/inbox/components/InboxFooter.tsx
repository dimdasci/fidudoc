type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface InboxFooterProps {
  visibleCount: number;
  totalCount: number;
  selectedCount: number;
  t: TranslateFn;
}

export function InboxFooter({
  visibleCount,
  totalCount,
  selectedCount,
  t,
}: InboxFooterProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="text-body-sm text-secondary">
        {t("inbox.footer.showing", {
          count: visibleCount,
          total: totalCount,
        })}
      </div>
      {selectedCount > 0 && (
        <div className="text-body-sm font-medium text-primary">
          {t("inbox.footer.selected", { count: selectedCount })}
        </div>
      )}
    </div>
  );
}
