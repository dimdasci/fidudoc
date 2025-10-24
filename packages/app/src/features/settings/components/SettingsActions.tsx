import { Button } from "@shared/ui/Button/Button";
import { AlertCircle } from "lucide-react";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

interface SettingsActionsProps {
  hasChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onRevert: () => void;
  onApply: () => void;
  t: TranslateFn;
}

export function SettingsActions({
  hasChanges,
  isSaving,
  onSave,
  onRevert,
  onApply,
  t,
}: SettingsActionsProps) {
  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onSave}
          disabled={!hasChanges || isSaving}
          variant="primary"
          size="sm"
        >
          {isSaving ? t("settings.buttons.saving") : t("settings.buttons.save")}
        </Button>
        <Button
          onClick={onRevert}
          disabled={!hasChanges || isSaving}
          variant="secondary"
          size="sm"
        >
          {t("settings.buttons.revert")}
        </Button>
        <Button onClick={onApply} variant="ghost" size="sm">
          {t("settings.buttons.apply")}
        </Button>
      </div>
      {hasChanges && (
        <div className="inline-flex items-center gap-2 text-body-sm text-warning">
          <AlertCircle size={16} className="text-warning" />
          <span>{t("settings.status.unsaved")}</span>
        </div>
      )}
    </div>
  );
}
