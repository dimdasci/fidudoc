import { NodeContext } from "@effect/platform-node";
import { SqlClient } from "@effect/sql";
import { PgClient, PgMigrator } from "@effect/sql-pg";
import { Effect, Layer, String as EffectString } from "effect";
import { identity } from "effect/Function";
import { fileURLToPath } from "node:url";
import { AppConfig } from "./Config.ts";
import { makeTestLayer } from "./lib/Layer.js";

export const pgConfig = {
  transformQueryNames: EffectString.camelToSnake,
  transformResultNames: EffectString.snakeToCamel,
  // - 114: JSON (return as string instead of parsed object)
  // - 1082: DATE
  // - 1114: TIMESTAMP WITHOUT TIME ZONE
  // - 1184: TIMESTAMP WITH TIME ZONE
  // - 3802: JSONB (return as string instead of parsed object)
  types: {
    114: {
      to: 25,
      from: [114],
      parse: identity,
      serialize: identity,
    },
    1082: {
      to: 25,
      from: [1082],
      parse: identity,
      serialize: identity,
    },
    1114: {
      to: 25,
      from: [1114],
      parse: identity,
      serialize: identity,
    },
    1184: {
      to: 25,
      from: [1184],
      parse: identity,
      serialize: identity,
    },
    3802: {
      to: 25,
      from: [3802],
      parse: identity,
      serialize: identity,
    },
  },
};

const ClientLive = Layer.unwrapEffect(
  Effect.gen(function*() {
    const config = yield* AppConfig;
    return PgClient.layer({
      url: config.database.url,
      ...pgConfig,
    });
  }),
);

const MigratorLive = PgMigrator.layer({
  loader: PgMigrator.fromFileSystem(
    fileURLToPath(new URL("./migrations", import.meta.url)),
  ),
}).pipe(Layer.provide(NodeContext.layer));

export const SqlLive = MigratorLive.pipe(Layer.provideMerge(ClientLive));

export const SqlTest = makeTestLayer(SqlClient.SqlClient)({
  withTransaction: identity,
});
