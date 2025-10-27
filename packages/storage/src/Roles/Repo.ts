import { Model, SqlClient, SqlSchema } from "@effect/sql";
import { Effect, pipe } from "effect";
import { AccountId } from "../Domain/Account.ts";
import { Role } from "../Domain/Role.ts";
import { SqlLive } from "../Sql.ts";

export class RolesRepo extends Effect.Service<RolesRepo>()(
  "RolesRepo",
  {
    dependencies: [SqlLive],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient;

      // Standard CRUD operations
      const repo = yield* Model.makeRepository(Role, {
        tableName: "roles",
        spanPrefix: "RolesRepo",
        idColumn: "id",
      });

      const findByAccountIdSchema = SqlSchema.findAll({
        Request: AccountId,
        Result: Role,
        execute: (accountId) =>
          sql`select * from roles where account_id = ${accountId}`,
      });
      const findByAccountId = (accountId: AccountId) =>
        pipe(
          findByAccountIdSchema(accountId),
          Effect.withSpan("RolesRepo.findByAccountId"),
        );

      return {
        ...repo,
        findByAccountId,
      } as const;
    }),
  },
) {}
