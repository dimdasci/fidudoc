export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Session {
  user: User;
  accessToken: string;
  expiresAt: number;
}

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; session: Session }
  | { status: "unauthenticated" };

export type OTPStep = "email" | "code";

export interface AuthError {
  message: string;
  code?: string;
}
