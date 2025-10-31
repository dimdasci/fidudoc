import { useI18nContext } from "@shared/i18n/i18n";
import { signOut } from "../services/auth";

interface UnknownAccountMessageProps {
  email: string;
}

export function UnknownAccountMessage({ email }: UnknownAccountMessageProps) {
  const { t } = useI18nContext();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/signin";
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-surface"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="max-w-md w-full px-6 space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-heading text-2xl font-semibold text-primary mb-2">
            {t("auth.unknownAccount.title")}
          </h1>
          <p className="text-body text-secondary">
            {t("auth.unknownAccount.subtitle")}
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
            {t("auth.unknownAccount.message", { email })}
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {t("auth.unknownAccount.instruction")}
          </p>
          <div className="mt-3">
            <a
              href="mailto:support@fidudoc.eu"
              className="text-sm font-medium text-accent hover:opacity-80 transition-opacity"
            >
              support@fidudoc.eu
            </a>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full px-4 py-2 text-body text-secondary hover:text-primary transition-colors border border-subtle rounded-lg"
        >
          {t("auth.signOut")}
        </button>
      </div>
    </div>
  );
}
