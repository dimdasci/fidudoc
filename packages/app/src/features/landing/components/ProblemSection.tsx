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
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-primary mb-12 text-center">
          {t("landing.problem.title")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {problems.map((problem, index) => {
            const IconComponent = problem.icon;
            return (
              <div key={index} className="flex gap-4">
                <div className="flex-none pt-1">
                  <IconComponent
                    size={24}
                    className="text-accent"
                  />
                </div>
                <p className="text-body text-secondary">
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
