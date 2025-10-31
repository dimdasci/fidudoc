import { Schema } from "effect";

/**
 * Authentication and Authorization Domain Errors
 *
 * These are the standardized domain errors for auth-related failures.
 * Used by ErrorMapper.ts to provide consistent HTTP status codes and
 * frontend-friendly error responses.
 */

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  {
    message: Schema.optional(Schema.String),
  },
) {}

export class Forbidden extends Schema.TaggedError<Forbidden>()(
  "Forbidden",
  {
    resource: Schema.optional(Schema.String),
    action: Schema.optional(Schema.String),
    message: Schema.optional(Schema.String),
  },
) {}
