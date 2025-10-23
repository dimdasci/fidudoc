/**
 * Domain Types - Core business entities
 *
 * These types represent the fundamental business concepts in the Fidudoc system.
 * They are shared across all bounded contexts.
 */

// ============================================================================
// Settings Domain
// ============================================================================

export interface Settings {
  intake: {
    sources: Array<{
      id: string;
      type: "gdrive" | "email" | "portal" | "chat";
      folderId?: string;
      polling: string;
    }>;
  };
  routing: {
    rules: Array<{
      documentType: string;
      destination: string;
    }>;
  };
  queryTemplates: Array<{
    name: string;
    query: Record<string, unknown>;
  }>;
  autoApproval: {
    enabled: boolean;
    minConfidence: number;
  };
}

// ============================================================================
// Documents Domain
// ============================================================================

export type DocumentType =
  | "invoice"
  | "receipt"
  | "contract"
  | "lease"
  | "tax_return"
  | "unknown";

export type DocumentStatus = "pending" | "approved" | "rejected";

export type ValidationStatus = "passed" | "failed" | "pending";

export type InspectionType = "vat" | "lease_vat" | "contract" | null;

export interface Document {
  id: string;
  fileName: string;
  documentType: DocumentType;
  status: DocumentStatus;
  validation_status?: ValidationStatus;
  client_id: string;
  clientName: string;
  confidence: number;
  uploadedAt: string;
  processedAt?: string;
  pdfStoragePath: string;
  jsonStoragePath?: string;
  extractedData?: Record<string, unknown>;
  inspectionType?: InspectionType;
}

// ============================================================================
// Users Domain
// ============================================================================

export type UserRole = "admin" | "operator" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

// ============================================================================
// Audit Domain
// ============================================================================

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, unknown>;
}
