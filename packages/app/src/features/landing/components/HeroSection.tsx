import { useI18nContext } from "@shared/i18n/i18n";

interface HeroSectionProps {
  onCTA: () => void;
}

export function HeroSection({ onCTA }: HeroSectionProps) {
  const { t } = useI18nContext();

  return (
    <section className="py-16 px-6 text-center">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-5xl font-bold text-primary mb-6">
          {t("landing.hero.headline")}
        </h1>
        <p className="text-xl text-secondary mb-8">
          {t("landing.hero.description")}
        </p>
        <button
          type="button"
          onClick={onCTA}
          className="px-8 py-3 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {t("landing.hero.cta")}
        </button>
      </div>
    </section>
  );
}
