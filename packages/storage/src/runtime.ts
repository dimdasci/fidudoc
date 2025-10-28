// Effect runtime

import { Layer, ManagedRuntime } from "effect";
import { CasbinLive } from "./Auth/Casbin.ts";
import { SupabaseLive } from "./Auth/Supabase.ts";
import { AppConfigLive } from "./Config.ts";
import { SqlLive } from "./Sql.ts";
import { UsersRepo } from "./Users/Repo.ts";

// All heavyweight, long-lived dependencies
// UsersRepo depends on SqlLive, which depends on AppConfig
// Provide AppConfig to the entire layer stack
const GlobalLayer = Layer.mergeAll(
  SupabaseLive,
  SqlLive,
  CasbinLive,
  UsersRepo.Default,
).pipe(Layer.provide(AppConfigLive));

// Create runtime once at boot
export const createRuntime = () => ManagedRuntime.make(GlobalLayer);

// Export type - inferred from the runtime creation function
export type AppRuntime = ReturnType<typeof createRuntime>;
