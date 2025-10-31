import { Effect, Schema } from "effect";
import { AccountId } from "../Domain/Account.ts";
import type { Principal } from "../Domain/Principal.ts";
import type { UserId } from "../Domain/User.ts";
import { Supabase } from "./Supabase.ts";

const JwtPayload = Schema.Struct({
  sub: Schema.UUID, // Supabase user ID
  user_metadata: Schema.Struct({
    accountId: Schema.optional(Schema.UUID), // Optional for root users
  }),
});

// Errors
export class InvalidToken extends Schema.TaggedError<InvalidToken>()(
  "InvalidToken",
  { message: Schema.String },
) {}

export class TokenExpired extends Schema.TaggedError<TokenExpired>()(
  "TokenExpired",
  {},
) {}

// Validate JWT and extract principal
export const validateToken = (token: string) =>
  Effect.gen(function*() {
    const { client } = yield* Supabase;

    // Verify JWT with Supabase
    const { data, error } = yield* Effect.promise(() => client.auth.getUser(token));

    if (error) {
      if (error.message.includes("expired")) {
        return yield* Effect.fail(new TokenExpired());
      }
      return yield* Effect.fail(
        new InvalidToken({ message: error.message }),
      );
    }

    if (!data.user) {
      return yield* Effect.fail(
        new InvalidToken({ message: "No user in token" }),
      );
    }

    // Parse user metadata (access accountId from user_metadata like frontend does)
    const payload = yield* Schema.decodeUnknown(JwtPayload)({
      sub: data.user.id,
      user_metadata: data.user.user_metadata || {},
    }).pipe(
      Effect.mapError(
        (err) =>
          new InvalidToken({
            message: `Invalid token payload: ${err.message}`,
          }),
      ),
    );

    // Construct principal
    const principal: Principal = {
      userId: payload.sub as UserId,
      accountId: payload.user_metadata.accountId
        ? AccountId.make(payload.user_metadata.accountId)
        : undefined,
    };

    return principal;
  });
