import { useI18nContext } from "@shared/i18n/i18n";

export function SolutionSection() {
  const { t } = useI18nContext();

  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-primary mb-8">
          {t("landing.solution.title")}
        </h2>
        <div className="space-y-4">
          <p className="text-body text-secondary">
            {t("landing.solution.description")}
          </p>
          <p className="text-body text-secondary">
            {t("landing.solution.details")}
          </p>
          <p className="text-body text-secondary pt-4">
            {t("landing.solution.note")}
          </p>
        </div>
      </div>
    </section>
  );
}
