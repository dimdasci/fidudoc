import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { activateLocale, getPreferredLocale } from "../i18n/i18n";
import { router } from "./router";

const qc = new QueryClient();

export function AppProviders() {
  useEffect(() => {
    // Initialize i18n with user's preferred locale
    const preferredLocale = getPreferredLocale();
    activateLocale(preferredLocale);
  }, []);

  return (
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nProvider>
  );
}
