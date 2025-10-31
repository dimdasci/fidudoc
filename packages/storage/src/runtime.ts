// Effect runtime

import { Layer, ManagedRuntime } from "effect";
import { AccountsRepoLive } from "./Accounts/Repo.ts";
import { AccountsServiceLive } from "./Accounts/Service.ts";
import { AccountPermissionsLive } from "./Auth/AccountPermissions.ts";
import { CasbinLive } from "./Auth/Casbin.ts";
import { SupabaseLive } from "./Auth/Supabase.ts";
import { AppConfigLive } from "./Config.ts";
import { SqlLive } from "./Sql.ts";
import { UsersRepoLive } from "./Users/Repo.ts";
import { UsersServiceLive } from "./Users/Service.ts";
import { UuidLive } from "./Uuid.ts";

// All heavyweight, long-lived dependencies
// Layer dependency order is important:
// 1. Base services: Config, SQL, Supabase, UUID
// 2. Repositories: depend on SQL
// 3. Services: depend on repositories and other services
const GlobalLayer = Layer.mergeAll(
  // Base services (no service dependencies)
  SqlLive,
  SupabaseLive,
  CasbinLive,
  UuidLive,
  // Repositories (depend on SQL)
  AccountsRepoLive,
  UsersRepoLive,
  // Services (depend on repositories and potentially other services)
  AccountsServiceLive, // Must come before UsersService
  UsersServiceLive, // Depends on AccountsService
  AccountPermissionsLive,
).pipe(Layer.provide(AppConfigLive));

// Create runtime once at boot
export const createRuntime = () => ManagedRuntime.make(GlobalLayer);

// Export type - inferred from the runtime creation function
export type AppRuntime = ReturnType<typeof createRuntime>;
