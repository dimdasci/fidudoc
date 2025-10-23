import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Link, Outlet } from "react-router-dom";
import { useI18nContext } from "../i18n/i18n";
import { checkApiHealth } from "../services/api";
import { useApiStore } from "../stores/api";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { showToast } from "./toast";
import { ToastContainer } from "./ToastContainer";

export function AppShell() {
  const { t } = useI18nContext();
  const { isHealthy, setHealthy, setError } = useApiStore();

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkApiHealth();
      setHealthy(healthy);
      if (!healthy) {
        const errorMessage = t("toast.apiConnectionFailed");
        setError(errorMessage);
        showToast(t("toast.apiError"), "error");
      } else {
        setError(null);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [setHealthy, setError, t]);

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed height */}
      <header className="flex-none h-16 bg-surface border-b border-gray-200 px-6 flex items-center justify-between">
        <div>
          <h1 className="logo-text text-2xl text-gray-900">
            {t("app.title")}
          </h1>
        </div>
        <div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main content - Flexible height with 3-pane layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left sidebar - Navigation */}
          <Panel defaultSize={18} minSize={15}>
            <aside className="h-full bg-surface border-r border-gray-200">
              <nav className="flex flex-col p-4 gap-2">
                {[
                  { path: "/", label: "nav.inbox" },
                  { path: "/settings", label: "nav.settings" },
                  { path: "/admin", label: "nav.admin" },
                ].map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    {t(label)}
                  </Link>
                ))}
              </nav>
            </aside>
          </Panel>
          <PanelResizeHandle className="resizer" />

          {/* Center - Main content */}
          <Panel minSize={30}>
            <main className="h-full overflow-auto bg-background">
              <Outlet />
            </main>
          </Panel>
          <PanelResizeHandle className="resizer" />

          {/* Right sidebar - Details */}
          <Panel defaultSize={28} minSize={20}>
            <section className="h-full bg-surface border-l border-gray-200">
              <div className="p-6">
                <p className="text-gray-600">
                  {t("panel.details")}
                </p>
              </div>
            </section>
          </Panel>
        </PanelGroup>
      </div>

      {/* Footer - Fixed height */}
      <footer className="flex-none h-12 bg-surface border-t border-gray-200 px-6 flex items-center">
        <div className="flex items-center gap-2 text-sm">
          {isHealthy
            ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-600">
                  {t("header.connected")}
                </span>
              </>
            )
            : (
              <>
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-red-600">
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
