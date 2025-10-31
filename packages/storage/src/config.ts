import { Config, Effect } from "effect";

export class AppConfig extends Effect.Service<AppConfig>()("AppConfig", {
  effect: Effect.gen(function*() {
    const databaseUrl = yield* Config.redacted("DATABASE_URL");

    const supabaseUrl = yield* Config.string("SUPABASE_URL");
    const supabasePublicKey = yield* Config.string("SUPABASE_PUBLIC_KEY");
    const supabaseSecretKey = yield* Config.redacted("SUPABASE_SECRET_KEY");
    const supabaseJwtSecret = yield* Config.redacted("SUPABASE_JWT_SECRET");

    const sentryDsn = yield* Config.redacted("SENTRY_DSN_BACKEND");
    const sentryEnvironment = yield* Config.string("SENTRY_ENVIRONMENT").pipe(
      Config.withDefault("development"),
    );
    const sentryTracesSampleRate = yield* Config.number("SENTRY_TRACES_SAMPLE_RATE")
      .pipe(Config.withDefault(0.1));

    const cacheTtl = yield* Config.number("CACHE_TTL").pipe(Config.withDefault(3000));
    const cacheCleanupInterval = yield* Config.number("CACHE_CLEANUP_INTERVAL").pipe(
      Config.withDefault(60000),
    );

    const serverHost = yield* Config.string("SERVER_HOST").pipe(
      Config.withDefault("localhost"),
    );
    const serverPort = yield* Config.number("SERVER_PORT").pipe(
      Config.withDefault(3000),
    );
    const serverEnvironment = yield* Config.string("SERVER_ENVIRONMENT").pipe(
      Config.withDefault<"development" | "production" | "staging" | "test">(
        "development",
      ),
    );

    return {
      database: {
        url: databaseUrl,
      },
      supabase: {
        url: supabaseUrl,
        publicKey: supabasePublicKey,
        secretKey: supabaseSecretKey,
        jwtSecret: supabaseJwtSecret,
      },
      sentry: {
        dsn: sentryDsn,
        environment: sentryEnvironment,
        tracesSampleRate: sentryTracesSampleRate,
      },
      cache: {
        ttl: cacheTtl,
        cleanupInterval: cacheCleanupInterval,
      },
      server: {
        host: serverHost,
        port: serverPort,
        environment: serverEnvironment,
      },
    };
  }),
}) {}

export const AppConfigLive = AppConfig.Default;
