import { AlertCircle, Mail, Clock, FolderOpen, CheckCircle } from "lucide-react";
import { useI18nContext } from "@shared/i18n/i18n";

export function ProblemSection() {
  const { t } = useI18nContext();

  const problems = [
    {
      icon: Mail,
      text: t("landing.problem.point1"),
    },
    {
      icon: Clock,
      text: t("landing.problem.point2"),
    },
    {
      icon: FolderOpen,
      text: t("landing.problem.point3"),
    },
    {
      icon: CheckCircle,
      text: t("landing.problem.point4"),
    },
  ];

  return (
    <section className="py-16 px-6 bg-surface">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-primary mb-12 text-center">
          {t("landing.problem.title")}
        </h2>
        <div className="space-y-6">
          {problems.map((problem, index) => {
            const IconComponent = problem.icon;
            return (
              <div key={index} className="flex gap-4 items-center">
                <div className="flex-none flex-shrink-0">
                  <IconComponent
                    size={24}
                    className="text-accent"
                  />
                </div>
                <p className="text-body-lg text-secondary">
                  {problem.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
