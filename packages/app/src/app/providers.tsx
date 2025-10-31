import { AuthProvider } from "@features/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { initializeI18n } from "../i18n/i18n";
import { router } from "./router";

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1, // 1 minute
      retry: 1,
    },
  },
});

export function AppProviders() {
  const [isI18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    // Initialize i18n with user's preferred locale before rendering the app
    let isMounted = true;

    const initLocale = async () => {
      await initializeI18n();
      if (isMounted) {
        setI18nReady(true);
      }
    };

    void initLocale();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isI18nReady) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Loading interface…
      </div>
    );
  }

  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
