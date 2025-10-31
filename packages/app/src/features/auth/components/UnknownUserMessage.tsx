import { useI18nContext } from "@shared/i18n/i18n";

interface UnknownUserMessageProps {
  email: string;
  onBack: () => void;
}

export function UnknownUserMessage({ email, onBack }: UnknownUserMessageProps) {
  const { t } = useI18nContext();

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
          {t("auth.unknownUser.message", { email })}
        </p>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          {t("auth.unknownUser.instruction")}
        </p>
        <div className="mt-3">
          <a
            href="mailto:access@fidudoc.eu"
            className="text-sm font-medium text-accent hover:opacity-80 transition-opacity"
          >
            access@fidudoc.eu
          </a>
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="w-full px-4 py-2 text-body text-secondary hover:text-primary transition-colors"
      >
        {t("auth.backToEmail")}
      </button>
    </div>
  );
}
