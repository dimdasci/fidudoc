import { useI18nContext } from "../i18n/i18n";

const LANGUAGES = {
  en: { label: "English", flag: "🇬🇧" },
  es: { label: "Español", flag: "🇪🇸" },
  fr: { label: "Français", flag: "🇫🇷" },
  de: { label: "Deutsch", flag: "🇩🇪" },
};

export function LanguageSwitcher() {
  const { setLocale } = useI18nContext();

  const handleLanguageChange = (newLocale: string) => {
    void setLocale(newLocale as "en" | "es" | "fr" | "de");
  };

  return (
    <div>
      {Object.entries(LANGUAGES).map(([localeCode, { flag, label }]) => (
        <button
          key={localeCode}
          type="button"
          onClick={() => handleLanguageChange(localeCode)}
          title={label}
        >
          {flag}
        </button>
      ))}
    </div>
  );
}
