import { Model, SqlClient, SqlSchema } from "@effect/sql";
import { Effect, pipe, Schema } from "effect";
import { AccountId } from "../Domain/Account.ts";
import { Email } from "../Domain/Emails.ts";
import { User } from "../Domain/User.ts";
import { SqlLive } from "../Sql.ts";

export class UsersRepo extends Effect.Service<UsersRepo>()(
  "UsersRepo",
  {
    dependencies: [SqlLive],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient;

      // Standard CRUD operations
      const repo = yield* Model.makeRepository(User, {
        tableName: "users",
        spanPrefix: "UsersRepo",
        idColumn: "id",
      });

      const FindByEmailRequest = Schema.Struct({
        accountId: AccountId,
        email: Email,
      });
      const findByEmailSchema = SqlSchema.findOne({
        Request: FindByEmailRequest,
        Result: User,
        execute: ({ accountId, email }) =>
          sql`select * from users where account_id = ${accountId} and email = ${email}`,
      });
      const findByEmail = (accountId: AccountId, email: Email) =>
        pipe(
          findByEmailSchema({ accountId, email }),
          Effect.orDie,
          Effect.withSpan("UsersRepo.findByEmail"),
        );

      const findByAccountIdSchema = SqlSchema.findAll({
        Request: AccountId,
        Result: User,
        execute: (accountId) =>
          sql`select * from users where account_id = ${accountId}`,
      });
      const findByAccountId = (accountId: AccountId) =>
        pipe(
          findByAccountIdSchema(accountId),
          Effect.withSpan("UsersRepo.findByAccountId"),
        );

      return {
        ...repo,
        findByEmail,
        findByAccountId,
      } as const;
    }),
  },
) {}

export const UsersRepoLive = UsersRepo.Default;
