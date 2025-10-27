/**
 * Documents Service - Business capability for document management
 *
 * This service orchestrates document operations including upload, approval,
 * rejection, and retrieval. It's exposed at the top level to immediately
 * communicate this core business capability.
 */

import { generateMockDocuments } from "./Domain/mocks.ts";
import type { Document } from "./Domain/types.ts";

export interface IDocuments {
  listDocuments: (
    filters?: DocumentFilters,
  ) => Promise<{ total: number; documents: Document[] }>;
  getDocument: (id: string) => Promise<Document | null>;
  getDocumentPreview: (id: string) => Promise<DocumentPreview | null>;
  getExtractedData: (id: string) => Promise<ExtractedData | null>;
  approveDocuments: (
    ids: string[],
  ) => Promise<{ success: boolean; approvedIds: string[] }>;
  rejectDocuments: (
    ids: string[],
    reason?: string,
  ) => Promise<{ success: boolean; rejectedIds: string[] }>;
}

export interface DocumentFilters {
  status?: Document["status"];
  client_id?: string;
  type?: Document["documentType"];
  validation_status?: Document["validation_status"];
  period?: string;
  from?: string;
  to?: string;
}

export interface DocumentPreview {
  documentId: string;
  fileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
}

export interface ExtractedData {
  documentId: string;
  documentType: Document["documentType"];
  extractedAt?: string;
  data?: Record<string, unknown>;
}

/**
 * Helper function to apply period filter
 */
function applyPeriodFilter(documents: Document[], period: string): Document[] {
  const hoursMatch = period.match(/^(\d+)h$/);
  const daysMatch = period.match(/^(\d+)d$/);

  if (hoursMatch?.[1]) {
    const hours = parseInt(hoursMatch[1], 10);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return documents.filter((doc) => new Date(doc.uploadedAt) >= cutoff);
  }

  if (daysMatch?.[1]) {
    const days = parseInt(daysMatch[1], 10);
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return documents.filter((doc) => new Date(doc.uploadedAt) >= cutoff);
  }

  return documents;
}

/**
 * Helper function to apply date range filter
 */
function applyDateRangeFilter(
  documents: Document[],
  from?: string,
  to?: string,
): Document[] {
  let filtered = documents;

  if (from) {
    const fromDate = new Date(from);
    filtered = filtered.filter((doc) => new Date(doc.uploadedAt) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    filtered = filtered.filter((doc) => new Date(doc.uploadedAt) <= toDate);
  }

  return filtered;
}

/**
 * In-memory implementation of Documents service (mock)
 * In production, this would interact with a database via DocumentsRepo
 */
export function createDocumentsService(): IDocuments {
  const mockDocuments = generateMockDocuments(12);

  return {
    async listDocuments(filters?: DocumentFilters) {
      let filtered = [...mockDocuments];

      if (filters?.status) {
        filtered = filtered.filter((doc) => doc.status === filters.status);
      }

      if (filters?.client_id) {
        filtered = filtered.filter((doc) => doc.client_id === filters.client_id);
      }

      if (filters?.type) {
        filtered = filtered.filter((doc) => doc.documentType === filters.type);
      }

      if (filters?.validation_status) {
        filtered = filtered.filter((doc) =>
          doc.validation_status === filters.validation_status
        );
      }

      if (filters?.period && typeof filters.period === "string") {
        filtered = applyPeriodFilter(filtered, filters.period);
      }

      filtered = applyDateRangeFilter(filtered, filters?.from, filters?.to);

      return { total: filtered.length, documents: filtered };
    },

    async getDocument(id: string) {
      return mockDocuments.find((doc) => doc.id === id) || null;
    },

    async getDocumentPreview(id: string) {
      const document = mockDocuments.find((doc) => doc.id === id);
      if (!document) return null;

      return {
        documentId: document.id,
        fileName: document.fileName,
        downloadUrl: `https://storage.fidudoc.com/download/${document.id}`,
        contentType: "application/pdf",
        size: Math.round(Math.random() * 5000000),
      };
    },

    async getExtractedData(id: string) {
      const document = mockDocuments.find((doc) => doc.id === id);
      if (!document) return null;

      return {
        documentId: document.id,
        documentType: document.documentType,
        extractedAt: document.processedAt,
        data: document.extractedData,
      };
    },

    async approveDocuments(ids: string[]) {
      return { success: true, approvedIds: ids };
    },

    async rejectDocuments(ids: string[], _reason?: string) {
      return { success: true, rejectedIds: ids };
    },
  };
}
