import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE casbin_rule (
      id SERIAL PRIMARY KEY,
      ptype VARCHAR(255) NOT NULL,
      v0 VARCHAR(255),
      v1 VARCHAR(255),
      v2 VARCHAR(255),
      v3 VARCHAR(255),
      v4 VARCHAR(255),
      v5 VARCHAR(255)
    )
  `;

  yield* sql`CREATE INDEX idx_casbin_rule ON casbin_rule(ptype, v0, v1)`;
});
