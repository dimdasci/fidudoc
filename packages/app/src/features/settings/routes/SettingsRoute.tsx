import { SettingsActions } from "@features/settings/components/SettingsActions";
import { SettingsEditor } from "@features/settings/components/SettingsEditor";
import { SettingsHeader } from "@features/settings/components/SettingsHeader";
import {
  type SettingsData,
  useSettingsQuery,
  useUpdateSettings,
} from "@features/settings/hooks/useSettings";
import { useI18nContext } from "@shared/i18n/i18n";
import { showToast } from "@shared/ui/toast";
import { useEffect, useState } from "react";

export function SettingsRoute() {
  const { t } = useI18nContext();
  const { data, isLoading, error } = useSettingsQuery();
  const updateMutation = useUpdateSettings();

  const [jsonValue, setJsonValue] = useState<string>("");
  const [savedJson, setSavedJson] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (data) {
      const serialized = serializeSettings(data);
      setJsonValue(serialized);
      setSavedJson(serialized);
      setHasChanges(false);
    }
  }, [data]);

  useEffect(() => {
    if (savedJson) {
      setHasChanges(jsonValue !== savedJson);
    }
  }, [jsonValue, savedJson]);

  const handleSave = () => {
    try {
      const parsed = JSON.parse(jsonValue) as Partial<SettingsData>;
      updateMutation.mutate(parsed, {
        onSuccess: (response) => {
          const serialized = serializeSettings(response.settings);
          setJsonValue(serialized);
          setSavedJson(serialized);
          setHasChanges(false);
          showToast(t("settings.toast.saved"), "success");
        },
        onError: () => {
          showToast(t("settings.toast.error"), "error");
        },
      });
    } catch {
      showToast(t("settings.toast.error"), "error");
    }
  };

  const handleRevert = () => {
    setJsonValue(savedJson);
    setHasChanges(false);
    showToast(t("settings.toast.reverted"), "info");
  };

  const handleApply = () => {
    showToast(t("settings.toast.applied"), "success");
  };

  return (
    <div className="flex flex-col h-full">
      <SettingsHeader t={t} />

      <SettingsActions
        hasChanges={hasChanges}
        isSaving={updateMutation.isPending}
        onSave={handleSave}
        onRevert={handleRevert}
        onApply={handleApply}
        t={t}
      />

      <SettingsEditor
        value={jsonValue}
        onChange={setJsonValue}
        isLoading={isLoading}
        error={Boolean(error)}
        t={t}
      />
    </div>
  );
}

function serializeSettings(settings: SettingsData | Partial<SettingsData>): string {
  try {
    return JSON.stringify(settings, null, 2);
  } catch {
    return "";
  }
}
