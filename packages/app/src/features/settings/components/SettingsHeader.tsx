type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function SettingsHeader({ t }: { t: TranslateFn }) {
  return (
    <div className="mb-6">
      <div className="space-y-1">
        <h2 className="text-headline font-semibold text-primary">
          {t("settings.title")}
        </h2>
        <p className="text-body text-secondary">
          {t("settings.subtitle")}
        </p>
      </div>
    </div>
  );
}
