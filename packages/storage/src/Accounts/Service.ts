import { SqlClient } from "@effect/sql";
import { Effect, Option, pipe, Schema } from "effect";
import {
  Account,
  type AccountId,
  AccountIdFromString,
  AccountNotFound,
} from "../Domain/Account.ts";
import { SqlLive } from "../Sql.ts";
import { Uuid, UuidLive } from "../Uuid.ts";
import { AccountsRepo, AccountsRepoLive } from "./Repo.ts";

export class AccountsService extends Effect.Service<AccountsService>()(
  "Accounts/Service",
  {
    dependencies: [SqlLive, AccountsRepoLive, UuidLive],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient;
      const repo = yield* AccountsRepo;
      const uuid = yield* Uuid;

      yield* Effect.logInfo("[AccountsService] Initialized");

      const create = (account: typeof Account.jsonCreate.Type) =>
        pipe(
          uuid.generate,
          Effect.flatMap((uuidString) =>
            Schema.decodeUnknown(AccountIdFromString)(uuidString)
          ),
          Effect.tap((accountId) =>
            Effect.logInfo(
              "[AccountsService.create] Decoded AccountId:",
              accountId,
            )
          ),
          Effect.flatMap((accountId) =>
            repo.insert(Account.insert.make({
              id: accountId,
              ...account,
            }))
          ),
          Effect.tap((result) =>
            Effect.logInfo(
              "[AccountsService.create] Insert result:",
              result,
            )
          ),
          sql.withTransaction,
          Effect.catchTag("SqlError", (e) => Effect.die(e)),
          Effect.withSpan("AccountsService.create"),
        );

      const findById = (id: AccountId) =>
        pipe(
          repo.findById(id),
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.fail(new AccountNotFound({ id: id })),
              onSome: Effect.succeed,
            }),
          ),
          Effect.withSpan("Accounts.findById", { attributes: { id } }),
        );

      return { create, findById } as const;
    }),
  },
) {}

export const AccountsServiceLive = AccountsService.Default;
