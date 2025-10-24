type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function AuditHeader({ t }: { t: TranslateFn }) {
  return (
    <div className="mb-6">
      <div className="space-y-1">
        <h2 className="text-headline font-semibold text-heading">
          {t("audit.title")}
        </h2>
        <p className="text-body text-secondary">
          {t("audit.subtitle")}
        </p>
      </div>
    </div>
  );
}
