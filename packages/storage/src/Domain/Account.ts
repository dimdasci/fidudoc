import { Model } from "@effect/sql";
import { Schema } from "effect";

export const AccountId = Schema.UUID.pipe(Schema.brand("AccountId"));
export type AccountId = typeof AccountId.Type;

export class Account extends Model.Class<Account>("Account")({
  id: Model.GeneratedByApp(AccountId),
  displayName: Schema.NonEmptyTrimmedString,
  legalName: Schema.NonEmptyTrimmedString,
  isActive: Schema.Boolean,
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
}) {}

export const AccountIdFromString = Schema.UUID.pipe(Schema.compose(AccountId));

export class AccountNotFound extends Schema.TaggedError<AccountNotFound>()(
  "AccountNotFound",
  { id: Schema.String },
) {}

// Json schemas for API input/output
export const AccountJsonCreate = Account.jsonCreate;
export const AccountJsonUpdate = Account.jsonUpdate;
export const AccountJson = Account.json;
