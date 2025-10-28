import { Context, Schema } from "effect";
import { AccountId } from "./Account.ts";
import { UserId } from "./User.ts";

export const Principal = Schema.Struct({
  userId: UserId,
  accountId: Schema.optional(AccountId),
});

export type Principal = typeof Principal.Type;

export class CurrentPrincipal extends Context.Tag(
  "@fidudoc/Auth/CurrentPrincipal",
)<CurrentPrincipal, Principal>() {}
