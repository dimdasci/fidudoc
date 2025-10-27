// Effect runtime

import { Layer, ManagedRuntime } from "effect";
import { AppConfig } from "./config.ts";
import { SqlLive } from "./Sql.ts";
import { UsersRepo } from "./Users/Repo.ts";

// All heavyweight, long-lived dependencies
// UsersRepo depends on SqlLive, which depends on AppConfig
// Provide AppConfig to the entire layer stack
const GlobalLayer = Layer.mergeAll(
  SqlLive,
  UsersRepo.Default,
).pipe(Layer.provide(AppConfig.Default));

// Create runtime once at boot
export const createRuntime = () => ManagedRuntime.make(GlobalLayer);

// Export type - inferred from the runtime creation function
export type AppRuntime = ReturnType<typeof createRuntime>;
