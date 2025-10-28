import { createClient } from "@supabase/supabase-js";
import * as Effect from "effect/Effect";
import { AppConfig, AppConfigLive } from "../Config.ts";

export class Supabase extends Effect.Service<Supabase>()("Supabase", {
  dependencies: [AppConfigLive],
  effect: Effect.gen(function*() {
    const config = yield* AppConfig;

    const supabaseUrl = config.supabase.url;
    const supabaseKey = config.supabase.publicKey;

    const client = createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    return { client } as const;
  }),
}) {}

export const SupabaseLive = Supabase.Default;
