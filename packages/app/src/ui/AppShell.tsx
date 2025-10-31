import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useI18nContext } from "../i18n/i18n";
import { checkApiHealth } from "../services/api";
import { useApiStore } from "../stores/api";
import { AppHeader } from "./AppHeader";
import { showToast } from "./toast";
import { ToastContainer } from "./ToastContainer";

export function AppShell() {
  const { t } = useI18nContext();
  const { isHealthy, setHealthy, setError } = useApiStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
      <AppHeader />

      {/* Main content - Flexible height with 3-pane layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left sidebar - Navigation */}
          <Panel defaultSize={12} minSize={12} maxSize={12}>
            <aside className="h-full bg-surface border-r border-subtle overflow-y-auto">
              <nav className="flex flex-col p-4 gap-6">
                {/* Documents Group */}
                <div>
                  <div className="text-body-lg font-semibold text-secondary pl-4 pr-4 py-2 mb-2">
                    {t("nav.group.documents")}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/documents/inbox"
                      className={`text-body text-secondary transition-colors border-l-4  pl-3 ${
                        isActive("/documents/inbox")
                          ? "border-accent"
                          : "border-transparent hover:text-primary"
                      }`}
                    >
                      {t("nav.inbox")}
                    </Link>
                    <span className="text-body text-secondary opacity-50 cursor-not-allowed border-l-4 border-transparent pl-3">
                      {t("nav.registry")}
                    </span>
                  </div>
                </div>

                {/* Clients Group */}
                <div>
                  <div className="text-body-lg font-semibold text-secondary pl-4 pr-4 py-2 mb-2">
                    {t("nav.group.clients")}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-body text-secondary opacity-50 cursor-not-allowed border-l-4 border-transparent pl-3">
                      {t("nav.clients")}
                    </span>
                  </div>
                </div>

                {/* Inspections Group */}
                <div>
                  <div className="text-body-lg font-semibold text-secondary pl-4 pr-4 py-2 mb-2">
                    {t("nav.group.inspections")}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-body text-secondary opacity-50 cursor-not-allowed border-l-4 border-transparent pl-3">
                      {t("nav.vat")}
                    </span>
                    <span className="text-body text-secondary opacity-50 cursor-not-allowed border-l-4 border-transparent pl-3">
                      {t("nav.renewal")}
                    </span>
                  </div>
                </div>

                {/* Settings Group */}
                <div>
                  <div className="text-body-lg font-semibold text-secondary pl-4 pr-4 py-2 mb-2">
                    {t("nav.group.settings")}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/settings"
                      className={`text-body text-secondary transition-colors border-l-4  pl-3 ${
                        isActive("/settings")
                          ? "border-accent"
                          : "border-transparent hover:text-primary"
                      }`}
                    >
                      {t("nav.settings")}
                    </Link>
                    <span className="text-body text-secondary opacity-50 cursor-not-allowed border-l-4 border-transparent pl-3">
                      {t("nav.integrations")}
                    </span>
                    <Link
                      to="/users"
                      className={`text-body text-secondary transition-colors border-l-4  pl-3 ${
                        isActive("/users")
                          ? "border-accent"
                          : "border-transparent hover:text-primary"
                      }`}
                    >
                      {t("nav.users")}
                    </Link>
                    <Link
                      to="/users/roles"
                      className={`text-body text-secondary transition-colors border-l-4  pl-3 ${
                        isActive("/users/roles")
                          ? "border-accent"
                          : "border-transparent hover:text-primary"
                      }`}
                    >
                      {t("nav.roles")}
                    </Link>
                  </div>
                </div>

                {/* Audit Group */}
                <div>
                  <div className="text-body-lg font-semibold text-secondary pl-4 pr-4 py-2 mb-2">
                    {t("nav.group.audit")}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/audit"
                      className={`text-body text-secondary transition-colors border-l-4 pl-3 ${
                        isActive("/audit")
                          ? "border-accent"
                          : "border-transparent hover:text-primary"
                      }`}
                    >
                      {t("nav.audit")}
                    </Link>
                  </div>
                </div>
              </nav>
            </aside>
          </Panel>

          {/* Disabled resize handle between left and center panels */}
          <PanelResizeHandle className="pointer-events-none opacity-0 w-0" />

          {/* Center - Main content */}
          <Panel defaultSize={60} minSize={40}>
            <main className="h-full overflow-auto bg-background p-6">
              <Outlet />
            </main>
          </Panel>

          {/* Active resize handle between center and right panels */}
          <PanelResizeHandle className="resizer" />

          {/* Right sidebar - Details */}
          <Panel defaultSize={28} minSize={20}>
            <section className="h-full bg-surface border-l border-subtle">
              <div className="p-6">
                <p className="text-body text-secondary">
                  {t("panel.details")}
                </p>
              </div>
            </section>
          </Panel>
        </PanelGroup>
      </div>

      {/* Footer - Fixed height */}
      <footer className="flex-none h-12 bg-surface border-t border-subtle px-6 flex items-center">
        <div className="flex items-center gap-2 text-body-sm">
          {isHealthy
            ? (
              <>
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-secondary">
                  {t("header.connected")}
                </span>
              </>
            )
            : (
              <>
                <AlertCircle size={14} className="text-error" />
                <span className="text-error">
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
