import type { AuthError, Session } from "../types";
import { supabase } from "./supabase";

/**
 * Send OTP code to user's email
 */
export async function sendOTP(email: string): Promise<{ error?: AuthError }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Only allow existing users
    },
  });

  if (error) {
    return { error: { message: error.message, code: error.code } };
  }

  return {};
}

/**
 * Verify OTP code and establish session
 */
export async function verifyOTP(
  email: string,
  token: string,
): Promise<{ session?: Session; error?: AuthError }> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    return { error: { message: error.message, code: error.code } };
  }

  if (!data.session || !data.user) {
    return { error: { message: "No session returned after verification" } };
  }

  return {
    session: {
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        createdAt: data.user.created_at,
      },
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at || 0,
    },
  };
}

/**
 * Get current session from storage
 */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();

  if (!data.session || !data.session.user) {
    return null;
  }

  return {
    user: {
      id: data.session.user.id,
      email: data.session.user.email ?? "",
      createdAt: data.session.user.created_at,
    },
    accessToken: data.session.access_token,
    expiresAt: data.session.expires_at || 0,
  };
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<{ error?: AuthError }> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: { message: error.message, code: error.code } };
  }

  return {};
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
    if (!supabaseSession || !supabaseSession.user) {
      callback(null);
      return;
    }

    callback({
      user: {
        id: supabaseSession.user.id,
        email: supabaseSession.user.email ?? "",
        createdAt: supabaseSession.user.created_at,
      },
      accessToken: supabaseSession.access_token,
      expiresAt: supabaseSession.expires_at || 0,
    });
  });

  return () => {
    data.subscription.unsubscribe();
  };
}
