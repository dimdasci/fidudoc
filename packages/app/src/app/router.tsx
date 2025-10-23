import { AuditRoute } from "@features/audit";
import { InboxRoute } from "@features/inbox";
import { SettingsRoute } from "@features/settings/routes";
import { UsersRoute } from "@features/users";
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
        path: "users",
        element: <UsersRoute />,
      },
      {
        path: "audit",
        element: <AuditRoute />,
      },
    ],
  },
]);
