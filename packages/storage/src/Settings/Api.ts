/**
 * Settings API - HTTP contract definitions
 *
 * Defines the HTTP endpoints for the Settings bounded context
 */

export const SettingsEndpoints = {
  GET_SETTINGS: "get_settings",
  PUT_SETTINGS: "put_settings",
} as const;

export type GetSettingsRequest = Record<string, never>;

export interface GetSettingsResponse {
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

export interface PutSettingsRequest {
  intake?: {
    sources?: Array<{
      id: string;
      type: "gdrive" | "email" | "portal" | "chat";
      folderId?: string;
      polling: string;
    }>;
  };
  routing?: {
    rules?: Array<{
      documentType: string;
      destination: string;
    }>;
  };
  queryTemplates?: Array<{
    name: string;
    query: Record<string, unknown>;
  }>;
  autoApproval?: {
    enabled: boolean;
    minConfidence: number;
  };
}

export interface PutSettingsResponse {
  success: boolean;
  message: string;
  settings: GetSettingsResponse;
}
