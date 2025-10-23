import { createBrowserRouter } from "react-router-dom";
import { AdminRoute } from "../features/admin/routes";
import { InboxRoute } from "../features/inbox/routes";
import { SettingsRoute } from "../features/settings/routes";
import { AppShell } from "../ui/AppShell";

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
    ],
  },
]);
