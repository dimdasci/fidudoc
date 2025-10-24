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
        <ul className="space-y-6">
          {principles.map((principle) => (
            <li
              key={`principle-${principle.slice(0, 20)}`}
              className="flex gap-4 items-start"
            >
              <div className="flex-none w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-3" />
              <p className="text-body-lg text-secondary text-left">
                {principle}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
