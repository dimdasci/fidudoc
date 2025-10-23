import { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Link, useLocation, Outlet } from "react-router-dom";
import { checkApiHealth } from "../services/api";
import { useApiStore } from "../stores/api";
import { useI18nContext } from "../i18n/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ToastContainer, showToast } from "./primitives";
import { AlertCircle } from "lucide-react";

const colors = {
  light: {
    bg: "#f9fafb",
    bgSecondary: "#ffffff",
    text: "#111827",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    green: "#15803d",
    red: "#ef4444",
  },
  dark: {
    bg: "#111827",
    bgSecondary: "#1f2937",
    text: "#f3f4f6",
    textSecondary: "#9ca3af",
    border: "#374151",
    green: "#22c55e",
    red: "#f87171",
  },
};

const isDark = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const getColors = () => (isDark() ? colors.dark : colors.light);

export function AppShell() {
  const { t } = useI18nContext();
  const location = useLocation();
  const { isHealthy, setHealthy, setError } = useApiStore();
  const c = getColors();

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkApiHealth();
      setHealthy(healthy);
      if (!healthy) {
        const errorMessage = t("toast.apiConnectionFailed");
        setError(errorMessage);
        showToast(t("toast.apiError"), "error", 0);
      } else {
        setError(null);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [setHealthy, setError, t]);

  const isActive = (path: string) => location.pathname === path;

  const navStyle = (path: string): React.CSSProperties => ({
    padding: "12px 16px",
    textDecoration: "none",
    color: isActive(path) ? c.green : c.textSecondary,
    fontWeight: isActive(path) ? 600 : 400,
    borderLeft: isActive(path) ? `3px solid ${c.green}` : "3px solid transparent",
    display: "block",
    transition: "all 0.2s",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
  });

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: c.bg,
        color: c.text,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          height: 56,
          borderBottom: `1px solid ${c.border}`,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: c.bgSecondary,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: 700,
              color: c.green,
            }}
          >
            {t("app.title")}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main content with 3-pane layout */}
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <PanelGroup direction="horizontal">
          {/* Left sidebar - Navigation */}
          <Panel defaultSize={20} minSize={15}>
            <aside
              style={{
                height: "100%",
                borderRight: `1px solid ${c.border}`,
                overflow: "auto",
                background: c.bgSecondary,
              }}
            >
              <nav style={{ padding: "8px 0" }}>
                <Link to="/" style={navStyle("/")}>
                  {t("nav.inbox")}
                </Link>
                <Link to="/settings" style={navStyle("/settings")}>
                  {t("nav.settings")}
                </Link>
                <Link to="/admin" style={navStyle("/admin")}>
                  {t("nav.admin")}
                </Link>
              </nav>
            </aside>
          </Panel>
          <PanelResizeHandle
            style={{
              background: c.border,
              width: "1px",
              cursor: "col-resize",
            }}
          />

          {/* Center - Main content */}
          <Panel minSize={30}>
            <main
              style={{
                padding: "20px",
                height: "100%",
                overflow: "auto",
                background: c.bg,
              }}
            >
              <Outlet />
            </main>
          </Panel>
          <PanelResizeHandle
            style={{
              background: c.border,
              width: "1px",
              cursor: "col-resize",
            }}
          />

          {/* Right sidebar - Details */}
          <Panel defaultSize={30} minSize={20}>
            <section
              style={{
                height: "100%",
                borderLeft: `1px solid ${c.border}`,
                overflow: "auto",
                background: c.bgSecondary,
                padding: "20px",
              }}
            >
              <div style={{ minHeight: "100%", color: c.textSecondary }}>
                <p style={{ fontSize: "14px", margin: 0 }}>
                  {t("panel.details")}
                </p>
              </div>
            </section>
          </Panel>
        </PanelGroup>
      </div>

      {/* Footer - Status */}
      <footer
        style={{
          height: 40,
          borderTop: `1px solid ${c.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          background: c.bgSecondary,
          fontSize: "13px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isHealthy ? (
            <>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: c.green,
                }}
              />
              <span style={{ color: c.textSecondary }}>
                {t("header.connected")}
              </span>
            </>
          ) : (
            <>
              <AlertCircle size={14} style={{ color: c.red }} />
              <span style={{ color: c.red }}>
                {t("header.disconnected")}
              </span>
            </>
          )}
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
}
