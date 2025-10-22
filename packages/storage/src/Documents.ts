/**
 * Documents Service - Business capability for document management
 *
 * This service orchestrates document operations including upload, approval,
 * rejection, and retrieval. It's exposed at the top level to immediately
 * communicate this core business capability.
 */

import type { Document } from "./Domain/types.ts";
import { generateMockDocuments } from "./Domain/mocks.ts";

export interface IDocuments {
  listDocuments: (filters?: DocumentFilters) => Promise<{ total: number; documents: Document[] }>;
  getDocument: (id: string) => Promise<Document | null>;
  getDocumentPreview: (id: string) => Promise<DocumentPreview | null>;
  getExtractedData: (id: string) => Promise<ExtractedData | null>;
  approveDocuments: (ids: string[]) => Promise<{ success: boolean; approvedIds: string[] }>;
  rejectDocuments: (ids: string[], reason?: string) => Promise<{ success: boolean; rejectedIds: string[] }>;
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
        filtered = filtered.filter((doc) => doc.validation_status === filters.validation_status);
      }

      if (filters?.period && typeof filters.period === "string") {
        const hoursMatch = filters.period.match(/^(\d+)h$/);
        const daysMatch = filters.period.match(/^(\d+)d$/);

        if (hoursMatch && hoursMatch[1]) {
          const hours = parseInt(hoursMatch[1], 10);
          const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
          filtered = filtered.filter((doc) => new Date(doc.uploadedAt) >= cutoff);
        } else if (daysMatch && daysMatch[1]) {
          const days = parseInt(daysMatch[1], 10);
          const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
          filtered = filtered.filter((doc) => new Date(doc.uploadedAt) >= cutoff);
        }
      }

      if (filters?.from) {
        const from = new Date(filters.from);
        filtered = filtered.filter((doc) => new Date(doc.uploadedAt) >= from);
      }

      if (filters?.to) {
        const to = new Date(filters.to);
        filtered = filtered.filter((doc) => new Date(doc.uploadedAt) <= to);
      }

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

    async rejectDocuments(ids: string[], reason?: string) {
      return { success: true, rejectedIds: ids };
    },
  };
}
