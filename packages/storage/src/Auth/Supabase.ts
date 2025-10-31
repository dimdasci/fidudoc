import { createClient } from "@supabase/supabase-js";
import { Redacted } from "effect";
import * as Effect from "effect/Effect";
import { AppConfig, AppConfigLive } from "../Config.ts";

export class Supabase extends Effect.Service<Supabase>()("Supabase", {
  dependencies: [AppConfigLive],
  effect: Effect.gen(function*() {
    const config = yield* AppConfig;

    const supabaseUrl = config.supabase.url;
    const supabasePublicKey = config.supabase.publicKey;
    const supabaseSecretKey = Redacted.value(config.supabase.secretKey);

    // Public client for regular operations
    const client = createClient(
      supabaseUrl,
      supabasePublicKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Admin client for user management operations
    const adminClient = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    return { client, adminClient } as const;
  }),
}) {}

export const SupabaseLive = Supabase.Default;
