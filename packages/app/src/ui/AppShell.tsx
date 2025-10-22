import { Trans } from "@lingui/react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Outlet } from "react-router-dom";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function AppShell() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          height: 48,
          borderBottom: "1px solid #e5e7eb",
          padding: "0 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <strong>
          <Trans id="msg.app.title">Fiduciary Ops</Trans>
        </strong>
        <LanguageSwitcher />
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <PanelGroup direction="horizontal">
          <Panel defaultSize={22} minSize={15}>
            <aside
              style={{
                padding: "12px",
                height: "100%",
                borderRight: "1px solid #e5e7eb",
              }}
            >
              <Trans id="msg.panel.navigation">Navigation</Trans>
            </aside>
          </Panel>
          <PanelResizeHandle className="resizer" />
          <Panel minSize={30}>
            <main style={{ padding: "12px", height: "100%", overflow: "auto" }}>
              <Outlet />
            </main>
          </Panel>
          <PanelResizeHandle className="resizer" />
          <Panel defaultSize={28} minSize={20}>
            <section
              style={{
                padding: "12px",
                height: "100%",
                borderLeft: "1px solid #e5e7eb",
                overflow: "auto",
              }}
            >
              <Trans id="msg.panel.details">Details</Trans>
            </section>
          </Panel>
        </PanelGroup>
      </div>
      <footer
        style={{
          height: 32,
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
        }}
      >
        <Trans id="msg.status.connected">Status: Connected</Trans>
      </footer>
    </div>
  );
}
