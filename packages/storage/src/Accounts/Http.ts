/**
 * Accounts HTTP Handlers - Request/response mapping
 *
 * Maps HTTP requests to Accounts service operations
 */

import { Effect, Schema } from "effect";
import type { IRouter } from "express";
import {
  AccountIdFromString,
  AccountJson,
  AccountJsonCreate,
  AccountNotFound,
} from "../Domain/Account.ts";
import { effectHandler } from "../middleware/effect.ts";
import type { AppRuntime } from "../Runtime.ts";
import { AccountsService } from "./Service.ts";

export function registerAccountsRoutes(app: IRouter, runtime: AppRuntime) {
  // POST /accounts - Create a new account (temporarily simplified)
  app.post(
    "/accounts",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        // Parse and validate request body against AccountJsonCreate schema
        const accountData = yield* Schema.decodeUnknown(AccountJsonCreate)(
          req.body,
        );

        // Get the accounts service from context
        const service = yield* AccountsService;

        // Create the account
        const account = yield* service.create(accountData);

        // Encode to JSON schema for API response
        return yield* Schema.encode(AccountJson)(account);
      })),
  );

  // GET /accounts/:id - Get account by ID
  app.get(
    "/accounts/:id",
    effectHandler(runtime, (req) =>
      Effect.gen(function*() {
        // Parse and validate UUID from URL parameter
        // If parsing fails (invalid UUID), convert to AccountNotFound error
        const accountId = yield* Schema.decodeUnknown(AccountIdFromString)(
          req.params.id,
        ).pipe(
          Effect.catchTag("ParseError", (_parseError) =>
            // Treat invalid UUID same as nonexistent account (404)
            // Preserve the invalid input in error details for debugging
            Effect.fail(
              new AccountNotFound({ id: req.params.id || "<undefined>" }),
            )),
        );

        // Get the accounts service from context
        const service = yield* AccountsService;

        // Find account by ID
        const account = yield* service.findById(accountId);

        // Encode to JSON schema for API response
        return yield* Schema.encode(AccountJson)(account);
      })),
  );
}
