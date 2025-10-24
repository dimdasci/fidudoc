import { Zap, Tag, FolderCheck } from "lucide-react";
import { useI18nContext } from "@shared/i18n/i18n";

export function StepsSection() {
  const { t } = useI18nContext();

  const steps = [
    {
      icon: Zap,
      title: t("landing.steps.step1.title"),
      description: t("landing.steps.step1.description"),
    },
    {
      icon: Tag,
      title: t("landing.steps.step2.title"),
      description: t("landing.steps.step2.description"),
    },
    {
      icon: FolderCheck,
      title: t("landing.steps.step3.title"),
      description: t("landing.steps.step3.description"),
    },
  ];

  return (
    <section className="py-16 px-6 bg-surface">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-primary mb-12 text-center">
          {t("landing.steps.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="mb-4 p-3 bg-accent bg-opacity-10 rounded-lg">
                  <IconComponent
                    size={32}
                    className="text-accent"
                  />
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-accent text-white rounded-full font-bold mb-4">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-body text-secondary">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
