import { Model, SqlClient, SqlSchema } from "@effect/sql";
import { Effect, pipe, Schema } from "effect";
import { AccountId } from "../Domain/Account.ts";
import { Document, DocumentStatusType } from "../Domain/Document.ts";
import { SqlLive } from "../Sql.ts";

export class DocumentsRepo extends Effect.Service<DocumentsRepo>()(
  "DocumentsRepo",
  {
    dependencies: [SqlLive],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient;

      // Standard CRUD operations
      const repo = yield* Model.makeRepository(Document, {
        tableName: "documents",
        spanPrefix: "DocumentsRepo",
        idColumn: "id",
      });

      // Request schema for finding documents by account with optional status filter
      const FindByAccountRequest = Schema.Struct({
        accountId: AccountId,
        status: Schema.optional(DocumentStatusType),
      });

      // Find all documents by account, optionally filtered by status
      const findByAccountSchema = SqlSchema.findAll({
        Request: FindByAccountRequest,
        Result: Document,
        execute: ({ accountId, status }) => {
          if (status === undefined) {
            return sql`select * from documents where account_id = ${accountId} order by created_at desc`;
          }
          return sql`select * from documents where account_id = ${accountId} and status = ${status} order by created_at desc`;
        },
      });

      const findByAccount = (
        accountId: AccountId,
        status?: Schema.Schema.Type<typeof DocumentStatusType>,
      ) =>
        pipe(
          findByAccountSchema({
            accountId,
            status,
          }),
          Effect.withSpan("DocumentsRepo.findByAccount"),
        );

      // Paginated request schema for handling large datasets
      const FindByAccountPaginatedRequest = Schema.Struct({
        accountId: AccountId,
        status: Schema.optional(DocumentStatusType),
        limit: Schema.Number.pipe(Schema.positive(), Schema.int()),
        offset: Schema.Number.pipe(Schema.nonNegative(), Schema.int()),
      });

      // Find documents by account with pagination
      const findByAccountPaginatedSchema = SqlSchema.findAll({
        Request: FindByAccountPaginatedRequest,
        Result: Document,
        execute: ({ accountId, status, limit, offset }) => {
          if (status === undefined) {
            return sql`select * from documents where account_id = ${accountId} order by created_at desc limit ${limit} offset ${offset}`;
          }
          return sql`select * from documents where account_id = ${accountId} and status = ${status} order by created_at desc limit ${limit} offset ${offset}`;
        },
      });

      const findByAccountPaginated = (
        accountId: AccountId,
        options: {
          status?: Schema.Schema.Type<typeof DocumentStatusType>;
          limit: number;
          offset: number;
        },
      ) =>
        pipe(
          findByAccountPaginatedSchema({
            accountId,
            status: options.status,
            limit: options.limit,
            offset: options.offset,
          }),
          Effect.withSpan("DocumentsRepo.findByAccountPaginated"),
        );

      return {
        ...repo,
        findByAccount,
        findByAccountPaginated,
      } as const;
    }),
  },
) {}
