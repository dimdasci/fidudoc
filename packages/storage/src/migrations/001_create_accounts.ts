import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE accounts (
      id UUID PRIMARY KEY,
      display_name VARCHAR(255) NOT NULL,
      legal_name VARCHAR(255) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `;

  // Index for tenant lookups
  yield* sql`CREATE INDEX idx_accounts_client_id ON accounts(client_id)`;
  yield* sql`CREATE INDEX idx_accounts_is_active ON accounts(is_active)`;
});
