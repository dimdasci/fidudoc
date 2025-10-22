import { i18n } from "@lingui/core";
import { de, en, es, fr } from "make-plural/plurals";

const SUPPORTED_LOCALES = ["en", "es", "fr", "de"];

i18n.loadLocaleData("en", { plurals: en });
i18n.loadLocaleData("es", { plurals: es });
i18n.loadLocaleData("fr", { plurals: fr });
i18n.loadLocaleData("de", { plurals: de });

/**
 * Get the user's preferred locale based on:
 * 1. Saved preference in localStorage
 * 2. Browser navigator language
 * 3. Default to English
 */
export function getPreferredLocale(): string {
  // Check localStorage for saved preference
  const saved = localStorage.getItem("language");
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved;
  }

  // Check browser language
  const browserLang = navigator.language.split("-")[0];
  if (SUPPORTED_LOCALES.includes(browserLang)) {
    return browserLang;
  }

  // Default to English
  return "en";
}

export async function activateLocale(locale: string) {
  const validLocale = SUPPORTED_LOCALES.includes(locale) ? locale : "en";

  try {
    const { messages } = await import(
      `./locales/${validLocale}/messages.js`
    );
    i18n.load(validLocale, messages);
    i18n.activate(validLocale);
  } catch {
    // Fallback to English if import fails
    const { messages } = await import("./locales/en/messages.js");
    i18n.load("en", messages);
    i18n.activate("en");
  }
}
