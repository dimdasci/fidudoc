/**
 * Documents API - HTTP contract definitions
 *
 * Defines the HTTP endpoints for the Documents bounded context
 */

import type { Document, DocumentType, DocumentStatus, ValidationStatus } from "../Domain/types.ts";

export const DocumentsEndpoints = {
  LIST: "list_documents",
  GET: "get_document",
  PREVIEW: "get_document_preview",
  EXTRACTED_DATA: "get_extracted_data",
  APPROVE: "approve_documents",
  REJECT: "reject_documents",
} as const;

export interface ListDocumentsRequest {
  status?: DocumentStatus;
  client_id?: string;
  type?: DocumentType;
  validation_status?: ValidationStatus;
  period?: string;
  from?: string;
  to?: string;
}

export interface ListDocumentsResponse {
  total: number;
  documents: Document[];
}

export interface GetDocumentResponse extends Document {}

export interface GetDocumentPreviewResponse {
  documentId: string;
  fileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
}

export interface GetExtractedDataResponse {
  documentId: string;
  documentType: DocumentType;
  extractedAt?: string;
  data?: Record<string, unknown>;
}

export interface ApproveDocumentsRequest {
  ids: string[];
}

export interface ApproveDocumentsResponse {
  success: boolean;
  message: string;
  approvedIds: string[];
  timestamp: string;
}

export interface RejectDocumentsRequest {
  ids: string[];
  reason?: string;
}

export interface RejectDocumentsResponse {
  success: boolean;
  message: string;
  rejectedIds: string[];
  reason: string;
  timestamp: string;
}
