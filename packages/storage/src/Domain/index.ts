/**
 * Domain Layer - Core business entities and shared types
 *
 * This layer contains pure business logic and domain models that are
 * shared across bounded contexts (Settings, Documents, Users, etc.)
 */

export type {
  Settings,
  Document,
  User,
} from "./types.ts";

export {
  DOCUMENT_TYPES,
  DOCUMENT_STATUSES,
  VALIDATION_STATUSES,
  USER_ROLES,
} from "./constants.ts";
