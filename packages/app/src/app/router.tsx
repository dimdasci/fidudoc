import { createBrowserRouter } from "react-router-dom";
import { InboxRoute } from "../features/inbox/routes";
import { AppShell } from "../ui/AppShell";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <InboxRoute /> },
      {
        path: "kyc",
        lazy: () =>
          import("../features/kyc/routes").then((m) => ({
            Component: m.KycRoute,
          })),
      },
    ],
  },
]);
