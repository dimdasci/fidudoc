import * as Sentry from "@sentry/node";

function serializeCause(value) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: serializeCause(value.cause),
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 10).map(serializeCause);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value).slice(0, 20);
    return Object.fromEntries(
      entries.map(([key, nested]) => [key, serializeCause(nested)]),
    );
  }

  return value;
}

Sentry.init({
  dsn: process.env.SENTRY_DSN_BACKEND,
  environment: process.env.SENTRY_ENVIRONMENT || "development",
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 1.0,
  sendDefaultPii: true,
  enableLogs: true,
  beforeSend(event, hint) {
    const original = hint.originalException;
    if (original && typeof original === "object" && "cause" in original) {
      event.extra = {
        ...event.extra,
        cause: serializeCause(original.cause),
      };
    }

    if (!event.tags) {
      event.tags = {};
    }
    event.tags.runtime = process.env.NODE_ENV || "development";

    return event;
  },
});
