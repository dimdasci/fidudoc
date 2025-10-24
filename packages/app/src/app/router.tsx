import { AuditRoute } from "@features/audit";
import { InboxRoute } from "@features/inbox";
import { LandingRoute } from "@features/landing";
import { SettingsRoute } from "@features/settings";
import { UsersRoute } from "@features/users";
import { AppShell } from "@shared/ui/AppShell";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingRoute />,
  },
  {
    path: "/documents",
    element: <AppShell />,
    children: [
      {
        path: "inbox",
        element: <InboxRoute />,
      },
    ],
  },
  {
    path: "/audit",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <AuditRoute />,
      },
    ],
  },
  {
    path: "/settings",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <SettingsRoute />,
      },
    ],
  },
  {
    path: "/users",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <UsersRoute />,
      },
    ],
  },
]);
