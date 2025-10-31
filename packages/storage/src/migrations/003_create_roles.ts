import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE roles (
      id SERIAL PRIMARY KEY,
      account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      CONSTRAINT unique_role_per_account UNIQUE(account_id, name)
    )
  `;

  // Create root role
  yield* sql`
    INSERT INTO roles (account_id, name, description)
    VALUES (NULL, 'root', 'Global administrator with access to all tenants')
  `;
});
