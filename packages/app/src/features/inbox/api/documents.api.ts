import type { Document } from "@shared/services/api";
import { fetchDocuments } from "@shared/services/api";

export type { Document };

export interface ListDocumentsParams {
  status?: string;
  client_id?: string;
  type?: string;
  validation_status?: string;
  period?: string;
  from?: string;
  to?: string;
}

export interface ListDocumentsResponse {
  total: number;
  documents: Document[];
}

/**
 * Fetches documents scoped to the Inbox feature.
 */
export function listDocuments(params?: ListDocumentsParams) {
  return fetchDocuments(params);
}
