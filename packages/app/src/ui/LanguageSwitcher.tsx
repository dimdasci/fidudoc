import { useI18nContext } from "../i18n/i18n";

const LANGUAGES = {
  en: { label: "English", flag: "🇬🇧" },
  es: { label: "Español", flag: "🇪🇸" },
  fr: { label: "Français", flag: "🇫🇷" },
  de: { label: "Deutsch", flag: "🇩🇪" },
};

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18nContext();

  const handleLanguageChange = (newLocale: string) => {
    void setLocale(newLocale as "en" | "es" | "fr" | "de");
  };

  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {Object.entries(LANGUAGES).map(([localeCode, { flag, label }]) => (
        <button
          key={localeCode}
          type="button"
          onClick={() => handleLanguageChange(localeCode)}
          title={label}
          style={{
            background: locale === localeCode ? "#e5e7eb" : "transparent",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: locale === localeCode ? "bold" : "normal",
          }}
        >
          {flag}
        </button>
      ))}
    </div>
  );
}
