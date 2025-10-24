import { useI18nContext } from "@shared/i18n/i18n";

export function PrinciplesSection() {
  const { t } = useI18nContext();

  const principles = [
    t("landing.principles.point1"),
    t("landing.principles.point2"),
    t("landing.principles.point3"),
  ];

  return (
    <section className="py-16 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-primary mb-10">
          {t("landing.principles.title")}
        </h2>
        <ol className="space-y-6">
          {principles.map((principle, index) => (
            <li key={index} className="flex gap-4">
              <span className="flex-none w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <p className="text-body text-secondary text-left pt-1">
                {principle}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
