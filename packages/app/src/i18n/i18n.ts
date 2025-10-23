import { create } from "zustand";

const SUPPORTED_LOCALES = ["en", "es", "fr", "de"];
type Locale = typeof SUPPORTED_LOCALES[number];

type Messages = Record<string, string>;

const featureMessageModules = import.meta.glob("../features/*/i18n/*.json", {
  eager: true,
}) as Record<string, { default: Messages }>;

const FEATURE_MESSAGES: Record<string, Record<string, Messages>> = {};

for (const [path, module] of Object.entries(featureMessageModules)) {
  const match = path.match(/\.\.\/features\/([^/]+)\/i18n\/([a-zA-Z-]+)\.json$/);
  if (!match) continue;
  const [, feature, locale] = match;
  if (!FEATURE_MESSAGES[feature]) {
    FEATURE_MESSAGES[feature] = {};
  }
  FEATURE_MESSAGES[feature][locale] = module.default;
}

async function loadBaseMessages(locale: Locale): Promise<Messages> {
  try {
    const module = await import(`./locales/${locale}.json`);
    return module.default;
  } catch {
    const module = await import("./locales/en.json");
    return module.default;
  }
}

function loadFeatureMessages(locale: Locale): Messages {
  const messages: Messages = {};
  Object.values(FEATURE_MESSAGES).forEach((localeMap) => {
    const localized = localeMap[locale] ?? localeMap.en;
    if (localized) {
      Object.assign(messages, localized);
    }
  });
  return messages;
}

async function loadMessages(locale: Locale): Promise<Messages> {
  const baseMessages = await loadBaseMessages(locale);
  const featureMessages = loadFeatureMessages(locale);
  return { ...baseMessages, ...featureMessages };
}

interface I18nStore {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const useI18n = create<I18nStore>((set, get) => ({
  locale: "en",
  messages: {},

  setLocale: async (locale: Locale) => {
    if (!SUPPORTED_LOCALES.includes(locale)) {
      return;
    }

    const messages = await loadMessages(locale);
    set({ locale, messages });
    localStorage.setItem("language", locale);
  },

  t: (key: string, params?: Record<string, string | number>) => {
    const { messages } = get();
    let message = messages[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        message = message.replace(
          new RegExp(`{{${paramKey}}}`, "g"),
          String(paramValue),
        );
      });
    }

    return message;
  },
}));

/**
 * Get the user's preferred locale based on:
 * 1. Saved preference in localStorage
 * 2. Browser navigator language
 * 3. Default to English
 */
export function getPreferredLocale(): Locale {
  // Check localStorage for saved preference
  const saved = localStorage.getItem("language");
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved as Locale;
  }

  // Check browser language
  const browserLang = navigator.language.split("-")[0];
  if (SUPPORTED_LOCALES.includes(browserLang)) {
    return browserLang as Locale;
  }

  // Default to English
  return "en";
}

/**
 * Initialize i18n with the preferred locale
 */
export async function initializeI18n(): Promise<void> {
  const preferredLocale = getPreferredLocale();
  await useI18n.getState().setLocale(preferredLocale);
}

/**
 * React hook to use i18n in components
 */
export function useI18nContext() {
  const locale = useI18n((state) => state.locale);
  const t = useI18n((state) => state.t);
  const setLocale = useI18n((state) => state.setLocale);

  return {
    locale,
    t,
    setLocale,
  };
}

export const i18n = useI18n;
