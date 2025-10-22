/**
 * Domain Constants - Business domain values
 */

import type { DocumentType, DocumentStatus, ValidationStatus, UserRole } from "./types.ts";

export const DOCUMENT_TYPES: DocumentType[] = [
  "invoice",
  "receipt",
  "contract",
  "lease",
  "tax_return",
  "unknown",
];

export const DOCUMENT_STATUSES: DocumentStatus[] = [
  "pending_approval",
  "approved",
  "rejected",
];

export const VALIDATION_STATUSES: ValidationStatus[] = [
  "passed",
  "failed",
  "pending",
];

export const USER_ROLES: UserRole[] = ["admin", "operator", "viewer"];

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    "config.read",
    "config.write",
    "users.read",
    "users.write",
    "documents.read",
    "documents.write",
    "documents.approve",
    "audit.read",
  ],
  operator: [
    "documents.read",
    "documents.write",
    "documents.approve",
    "documents.reject",
    "entities.read",
    "entities.merge",
  ],
  viewer: [
    "documents.read",
    "documents.preview",
  ],
};
