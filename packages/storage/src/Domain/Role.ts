import { Model } from "@effect/sql";
import { Schema } from "effect";
import { AccountId } from "./Account.ts";

export const RoleType = Schema.Literal("root", "administrator", "user");
export type RoleType = typeof RoleType.Type;

export const RoleId = Schema.Number.pipe(Schema.brand("RoleId"));
export type RoleId = typeof RoleId.Type;

export class Role extends Model.Class<Role>("Role")({
  id: Model.Generated(RoleId),
  accountId: Model.FieldOption(AccountId), // NULL for root role
  name: Schema.NonEmptyTrimmedString,
  roleType: RoleType,
  description: Model.FieldOption(Schema.String),
  createdAt: Model.DateTimeInsert,
  updatedAt: Model.DateTimeUpdate,
}) {}

export class RoleNotFound extends Schema.TaggedError<RoleNotFound>()(
  "RoleNotFound",
  { id: RoleId },
) {}

// Json schemas for API input/output
export const RoleJsonCreate = Role.jsonCreate;
export const RoleJsonUpdate = Role.jsonUpdate;
export const RoleJson = Role.json;
