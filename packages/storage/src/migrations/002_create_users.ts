import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE users (
      id UUID PRIMARY KEY,
      account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL UNIQUE,
      display_name VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      title VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      last_login_at TIMESTAMP,
    )
  `;

  yield* sql`CREATE INDEX idx_users_account_id ON users(account_id)`;
  yield* sql`CREATE INDEX idx_users_is_active ON users(is_active)`;
});
