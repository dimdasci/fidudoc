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
    <div>
      {/* Header */}
      <header>
        <div>
          <h1>
            {t("app.title")}
          </h1>
        </div>
        <div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main content with 3-pane layout */}
      <div>
        <PanelGroup direction="horizontal">
          {/* Left sidebar - Navigation */}
          <Panel defaultSize={18} minSize={15}>
            <aside>
              <nav>
                {[
                  { path: "/", label: "nav.inbox" },
                  { path: "/settings", label: "nav.settings" },
                  { path: "/admin", label: "nav.admin" },
                ].map(({ path, label }) => (
                  <Link key={path} to={path}>
                    {t(label)}
                  </Link>
                ))}
              </nav>
            </aside>
          </Panel>
          <PanelResizeHandle className="resizer" />

          {/* Center - Main content */}
          <Panel minSize={30}>
            <main>
              <Outlet />
            </main>
          </Panel>
          <PanelResizeHandle className="resizer" />

          {/* Right sidebar - Details */}
          <Panel defaultSize={28} minSize={20}>
            <section>
              <div>
                <p>
                  {t("panel.details")}
                </p>
              </div>
            </section>
          </Panel>
        </PanelGroup>
      </div>

      {/* Footer - Status */}
      <footer>
        <div>
          {isHealthy
            ? (
              <>
                <div />
                <span>
                  {t("header.connected")}
                </span>
              </>
            )
            : (
              <>
                <AlertCircle size={14} />
                <span>
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
