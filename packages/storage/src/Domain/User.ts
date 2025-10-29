import { Model } from "@effect/sql";
import { Context, Schema } from "effect";
import { AccountId } from "./Account.js";
import { Email } from "./Emails.ts";

export const UserId = Schema.UUID.pipe(Schema.brand("UserId"));
export type UserId = typeof UserId.Type;

// Helper schema to transform empty strings to null
// This handles legacy database data where empty strings were stored instead of null
const OptionalNonEmptyString = Schema.transform(
  Schema.String,
  Schema.NullOr(Schema.NonEmptyTrimmedString),
  {
    strict: true,
    decode: (s) => (s === "" ? null : s),
    encode: (s) => (s === null ? "" : s),
  },
);

export class User extends Model.Class<User>("User")({
  id: Model.GeneratedByApp(UserId),
  accountId: Model.GeneratedByApp(AccountId),
  email: Email,
  displayName: Schema.NonEmptyTrimmedString,
  fullName: Schema.NonEmptyTrimmedString,
  isActive: Schema.Boolean,
  title: Model.FieldOption(OptionalNonEmptyString),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
  lastLoginAt: Model.FieldOption(Model.DateTimeFromDate),
}) {}

export const UserIdFromString = Schema.UUID.pipe(Schema.compose(UserId));

export class CurrentUser extends Context.Tag("User/CurrentUser")<
  CurrentUser,
  User
>() {}

export class UserNotFound extends Schema.TaggedError<UserNotFound>()(
  "UserNotFound",
  { id: Schema.String },
) {}

// Json schemas for API input/output
export const UserJsonCreate = User.jsonCreate;
export const UserJsonUpdate = User.jsonUpdate;
export const UserJson = User.json;

/* Note regarding user roles and permissions:

User-Role Connection
-- No join table needed!
-- User-role assignments are just rows in casbin_rule:

INSERT INTO casbin_rule (ptype, v0, v1, v2)
VALUES
  ('g', 'user-uuid-123', 'root', '*'),
  ('g', 'user-uuid-456', 'administrator', '42'),
  ('g', 'user-uuid-789', 'viewer', '42');

Translation:
User uuid-123 has role root in domain * (global)
User uuid-456 has role administrator in domain 42 (account 42)
User uuid-789 has role viewer in domain 42 (account 42)

The Full Picture

users table
  id (UUID)
  ↓
casbin_rule (ptype='g')  ← User-Role connection
  v0 = userId
  v1 = roleName
  v2 = domain
  ↓
casbin_rule (ptype='p')  ← Role-Permission definition
  v0 = roleName
  v1 = domain
  v2 = object
  v3 = action

*/
