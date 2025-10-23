import { AdminRoute } from "@features/admin/routes";
import { AuditRoute } from "@features/audit/routes";
import { InboxRoute } from "@features/inbox";
import { SettingsRoute } from "@features/settings/routes";
import { AppShell } from "@shared/ui/AppShell";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <InboxRoute /> },
      {
        path: "settings",
        element: <SettingsRoute />,
      },
      {
        path: "admin",
        element: <AdminRoute />,
      },
      {
        path: "audit",
        element: <AuditRoute />,
      },
    ],
  },
]);
