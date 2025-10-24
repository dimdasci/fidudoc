import { AlertCircle, Loader } from "lucide-react";
import type { ChangeEvent } from "react";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface SettingsEditorProps {
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
  error: boolean;
  t: TranslateFn;
}

export function SettingsEditor({ value, onChange, isLoading, error, t }: SettingsEditorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-body text-secondary">
        <Loader size={20} className="animate-spin" />
        <span>{t("settings.loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 text-body text-error">
        <AlertCircle size={20} />
        <span>{t("settings.error")}</span>
      </div>
    );
  }

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <textarea
      value={value}
      onChange={handleChange}
      spellCheck={false}
      className="w-full h-[480px] rounded-md border border-subtle bg-surface p-4 font-mono text-body-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
    />
  );
}
