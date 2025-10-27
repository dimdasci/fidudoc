/**
 * Domain Layer - Core business entities and shared types
 *
 * This layer contains pure business logic and domain models that are
 * shared across bounded contexts (Settings, Documents, Users, etc.)
 */

export type { Document, Settings, User } from "./types.ts";

export {
  DOCUMENT_STATUSES,
  DOCUMENT_TYPES,
  USER_ROLES,
  VALIDATION_STATUSES,
} from "./constants.ts";
