import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchSettings, updateSettings } from "../../services/api";
import { useI18nContext } from "../../i18n/i18n";
import { Button, Textarea, showToast } from "../../ui/primitives";

// Color system
const colors = {
  light: {
    bg: "#f9fafb",
    bgSecondary: "#ffffff",
    text: "#111827",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    green: "#15803d",
    red: "#ef4444",
    amber: "#f59e0b",
  },
  dark: {
    bg: "#111827",
    bgSecondary: "#1f2937",
    text: "#f3f4f6",
    textSecondary: "#9ca3af",
    border: "#374151",
    green: "#22c55e",
    red: "#f87171",
    amber: "#fbbf24",
  },
};

const isDark = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const getColors = () => (isDark() ? colors.dark : colors.light);

export function SettingsRoute() {
  const { t } = useI18nContext();
  const c = getColors();
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: 700,
            color: c.text,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {t("settings.title")}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: c.textSecondary,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {t("settings.description")}
        </p>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
        >
          {t("settings.save")}
        </Button>
        <Button
          variant="secondary"
          onClick={handleRevert}
          disabled={!hasChanges}
        >
          {t("settings.revert")}
        </Button>
        <Button variant="secondary" onClick={handleApply}>
          {t("settings.apply")}
        </Button>
        {hasChanges && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "12px",
              fontSize: "14px",
              color: c.amber,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
            }}
          >
            <AlertCircle size={16} />
            Unsaved changes
          </div>
        )}
      </div>

      {/* JSON Editor */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          background: c.bgSecondary,
          border: `1px solid ${c.border}`,
          borderRadius: "8px",
          padding: "20px",
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              color: c.textSecondary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Loader
              size={24}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span style={{ marginLeft: "12px" }}>
              Loading settings...
            </span>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              color: c.red,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <AlertCircle size={24} style={{ marginRight: "12px" }} />
            {t("settings.error")}
          </div>
        ) : (
          <Textarea
            value={jsonValue}
            onChange={(e) => setJsonValue(e.target.value)}
            style={{
              minHeight: "500px",
              fontFamily: "'Monaco', 'Courier New', monospace",
              fontSize: "13px",
              lineHeight: "1.6",
              tabSize: 2,
            }}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}
