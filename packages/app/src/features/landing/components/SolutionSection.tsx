import { useI18nContext } from "@shared/i18n/i18n";

export function SolutionSection() {
  const { t } = useI18nContext();

  return (
    <section className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-primary mb-6 text-center">
          {t("landing.solution.title")}
        </h2>
        <div className="space-y-4">
          <p className="text-lg text-secondary text-center">
            {t("landing.solution.description")}
          </p>
          <p className="text-body text-secondary text-center">
            {t("landing.solution.details")}
          </p>
          <p className="text-body text-secondary italic text-center pt-4">
            {t("landing.solution.note")}
          </p>
        </div>
      </div>
    </section>
  );
}
