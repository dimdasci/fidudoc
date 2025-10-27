import { Model } from "@effect/sql";
import { Context, Schema } from "effect";
import { AccountId } from "./Account.js";
import { Email } from "./Emails.ts";

export const UserId = Schema.Number.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

export const UserIdFromString = Schema.NumberFromString.pipe(
  Schema.compose(UserId),
);

export class User extends Model.Class<User>("User")({
  id: Model.GeneratedByApp(UserId),
  accountId: Model.GeneratedByApp(AccountId),
  email: Email,
  displayName: Schema.NonEmptyTrimmedString,
  fullName: Schema.NonEmptyTrimmedString,
  isActive: Schema.Boolean,
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
  lastLoginAt: Model.FieldOption(Model.DateTimeFromDate),
}) {}

export class CurrentUser extends Context.Tag("@fidudoc/User/CurrentUser")<
  CurrentUser,
  User
>() {}

export class UserNotFound extends Schema.TaggedError<UserNotFound>()(
  "UserNotFound",
  { id: UserId },
) {}

// Json schemas for API input/output
export const UserJsonCreate = User.jsonCreate;
export const UserJsonUpdate = User.jsonUpdate;
export const UserJson = User.json;
