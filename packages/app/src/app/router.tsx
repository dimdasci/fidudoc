import { AuditRoute } from "@features/audit";
import { ProtectedRoute, SignInRoute } from "@features/auth";
import { InboxRoute } from "@features/inbox";
import { LandingRoute } from "@features/landing";
import { RolesRoute } from "@features/roles";
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
    path: "/signin",
    element: <SignInRoute />,
  },
  {
    path: "/documents",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "inbox",
        element: <InboxRoute />,
      },
    ],
  },
  {
    path: "/audit",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AuditRoute />,
      },
    ],
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <SettingsRoute />,
      },
    ],
  },
  {
    path: "/users",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <UsersRoute />,
      },
      {
        path: "roles",
        element: <RolesRoute />,
      },
    ],
  },
]);
