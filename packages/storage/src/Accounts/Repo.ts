import { Model } from "@effect/sql";
import { Effect } from "effect";
import { Account } from "../Domain/Account.ts";
import { SqlLive } from "../Sql.ts";

export class AccountsRepo extends Effect.Service<AccountsRepo>()(
  "AccountsRepo",
  {
    dependencies: [SqlLive],
    effect: Model.makeRepository(Account, {
      tableName: "accounts",
      spanPrefix: "AccountsRepo",
      idColumn: "id",
    }),
  },
) {}

export const AccountsRepoLive = AccountsRepo.Default;
