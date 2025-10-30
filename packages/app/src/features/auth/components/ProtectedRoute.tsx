import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authState } = useAuth();

  if (authState.status === "loading") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Loading…
      </div>
    );
  }

  if (authState.status === "unauthenticated") {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}
