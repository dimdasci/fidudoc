import { useLingui } from "@lingui/react";
import { activateLocale } from "../i18n/i18n";

const LANGUAGES = {
  en: { label: "English", flag: "🇬🇧" },
  es: { label: "Español", flag: "🇪🇸" },
  fr: { label: "Français", flag: "🇫🇷" },
  de: { label: "Deutsch", flag: "🇩🇪" },
};

export function LanguageSwitcher() {
  const { i18n } = useLingui();

  const handleLanguageChange = (locale: string) => {
    activateLocale(locale);
    localStorage.setItem("language", locale);
  };

  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {Object.entries(LANGUAGES).map(([locale, { flag, label }]) => (
        <button
          key={locale}
          type="button"
          onClick={() => handleLanguageChange(locale)}
          title={label}
          style={{
            background: i18n.locale === locale ? "#e5e7eb" : "transparent",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: i18n.locale === locale ? "bold" : "normal",
          }}
        >
          {flag}
        </button>
      ))}
    </div>
  );
}
