import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { getSession, onAuthStateChange, signOut } from "../services/auth";
import type { AuthState, Session } from "../types";

interface AuthContextValue {
  authState: AuthState;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    // Initialize session from storage
    getSession()
      .then((session) => {
        if (session) {
          setAuthState({ status: "authenticated", session });
        } else {
          setAuthState({ status: "unauthenticated" });
        }
      })
      .catch((error) => {
        console.error("Failed to initialize session:", error);
        setAuthState({ status: "unauthenticated" });
      });

    // Listen to auth state changes
    const unsubscribe = onAuthStateChange((session: Session | null) => {
      if (session) {
        setAuthState({ status: "authenticated", session });
      } else {
        setAuthState({ status: "unauthenticated" });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error("Sign out error:", error);
    }
    setAuthState({ status: "unauthenticated" });
  };

  return (
    <AuthContext.Provider value={{ authState, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
