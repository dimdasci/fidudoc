import { useI18nContext } from "@shared/i18n/i18n";

export function FooterSection() {
  const { t } = useI18nContext();

  return (
    <footer className="py-12 px-6 bg-surface border-t border-subtle">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-body text-secondary mb-6">
            {t("landing.closing.title")}
          </p>
          <button
            className="px-8 py-3 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            {t("landing.closing.cta")}
          </button>
        </div>

        <div className="border-t border-subtle pt-8 flex justify-center gap-8">
          <a
            href="#"
            className="text-body text-secondary hover:text-primary transition-colors"
          >
            {t("landing.footer.privacy")}
          </a>
          <a
            href="#"
            className="text-body text-secondary hover:text-primary transition-colors"
          >
            {t("landing.footer.terms")}
          </a>
        </div>

        <div className="text-center mt-8 text-body-sm text-secondary">
          <p>© 2024 Fidudoc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
