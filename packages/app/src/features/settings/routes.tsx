import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18nContext } from "../../i18n/i18n";
import { fetchSettings, updateSettings } from "../../services/api";
import { showToast } from "../../ui/toast";

export function SettingsRoute() {
  const { t } = useI18nContext();
  const queryClient = useQueryClient();

  // State for the JSON editor
  const [jsonValue, setJsonValue] = useState<string>("");
  const [savedJsonValue, setSavedJsonValue] = useState<string>("");
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Fetch settings
  const { data, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      const newJsonString = JSON.stringify(response.settings, null, 2);
      setSavedJsonValue(newJsonString);
      setJsonValue(newJsonString);
      setHasChanges(false);
      showToast(t("settings.saved"), "success");
    },
    onError: () => {
      showToast(t("settings.error"), "error");
    },
  });

  // Initialize JSON value when data loads
  useEffect(() => {
    if (data) {
      const jsonString = JSON.stringify(data, null, 2);
      setJsonValue(jsonString);
      setSavedJsonValue(jsonString);
      setHasChanges(false);
    }
  }, [data]);

  // Track changes
  useEffect(() => {
    if (savedJsonValue) {
      setHasChanges(jsonValue !== savedJsonValue);
    }
  }, [jsonValue, savedJsonValue]);

  // Handlers
  const handleSave = () => {
    try {
      const parsedSettings = JSON.parse(jsonValue);
      updateMutation.mutate(parsedSettings);
    } catch {
      showToast(t("settings.error"), "error");
    }
  };

  const handleRevert = () => {
    setJsonValue(savedJsonValue);
    setHasChanges(false);
    showToast(t("settings.save"), "success");
  };

  const handleApply = () => {
    showToast(t("settings.apply"), "success");
  };

  return (
    <div>
      {/* Header */}
      <div>
        <h2>
          {t("settings.title")}
        </h2>
        <p>
          {t("settings.description")}
        </p>
      </div>

      {/* Action Buttons */}
      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
        >
          {t("settings.save")}
        </button>
        <button
          type="button"
          onClick={handleRevert}
          disabled={!hasChanges}
        >
          {t("settings.revert")}
        </button>
        <button
          type="button"
          onClick={handleApply}
        >
          {t("settings.apply")}
        </button>
        {hasChanges && (
          <div>
            <AlertCircle size={16} />
            Unsaved changes
          </div>
        )}
      </div>

      {/* JSON Editor */}
      <div>
        {isLoading
          ? (
            <div>
              <Loader size={24} />
              <span>
                Loading settings...
              </span>
            </div>
          )
          : error
          ? (
            <div>
              <AlertCircle size={24} />
              {t("settings.error")}
            </div>
          )
          : (
            <textarea
              value={jsonValue}
              onChange={(e) => setJsonValue(e.target.value)}
              spellCheck={false}
            />
          )}
      </div>
    </div>
  );
}
