import { useI18nContext } from "../i18n/i18n";
import { ChevronDownIcon } from "./icons";
import { MenuItem, MenuPopup, MenuRoot, MenuTrigger } from "./Menu";

const LANGUAGES = {
  en: { label: "English" },
  es: { label: "Español" },
  fr: { label: "Français" },
  de: { label: "Deutsch" },
};

type Locale = keyof typeof LANGUAGES;

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18nContext();

  const handleLanguageChange = (newLocale: string) => {
    void setLocale(newLocale as Locale);
  };

  const currentLanguage = LANGUAGES[locale as Locale]?.label || "English";

  return (
    <MenuRoot>
      <MenuTrigger>
        {currentLanguage} <ChevronDownIcon />
      </MenuTrigger>

      <MenuPopup>
        {Object.entries(LANGUAGES).map(([localeCode, { label }]) => (
          <MenuItem
            key={localeCode}
            onClick={() => handleLanguageChange(localeCode)}
            selected={locale === localeCode}
          >
            {label}
          </MenuItem>
        ))}
      </MenuPopup>
    </MenuRoot>
  );
}
