import { Model } from "@effect/sql";
import { Effect } from "effect";
import { Account } from "../Domain/Account.ts";
import { SqlLive } from "../Sql.ts";

export class AccountRepo extends Effect.Service<AccountRepo>()(
  "AccountRepo",
  {
    dependencies: [SqlLive],
    effect: Model.makeRepository(Account, {
      tableName: "accounts",
      spanPrefix: "AccountRepo",
      idColumn: "id",
    }),
  },
) {}

export const AccountsRepoLive = AccountRepo.Default;
