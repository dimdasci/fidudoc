/**
 * Storage API types and utility functions
 * Base URL: http://localhost:3000
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ============================================================================
// Types
// ============================================================================

export interface Document {
  id: string;
  fileName: string;
  documentType:
    | "invoice"
    | "receipt"
    | "contract"
    | "lease"
    | "tax_return"
    | "unknown";
  status: "pending" | "approved" | "rejected";
  validation_status?: "passed" | "failed" | "pending";
  client_id: string;
  clientName: string;
  confidence: number;
  uploadedAt: string;
  processedAt?: string;
  pdfStoragePath: string;
  jsonStoragePath?: string;
  extractedData?: Record<string, unknown>;
  inspectionType?: "vat" | "lease_vat" | "contract" | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "operator" | "viewer";
  permissions: string[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

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
// API Functions
// ============================================================================

export async function fetchDocuments(params?: {
  status?: string;
  client_id?: string;
  type?: string;
  validation_status?: string;
  period?: string;
  from?: string;
  to?: string;
}): Promise<{ total: number; documents: Document[] }> {
  const url = new URL(`${API_BASE_URL}/documents`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchDocument(id: string): Promise<Document> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchDocumentPreview(id: string): Promise<{
  documentId: string;
  fileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
}> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/preview`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchDocumentExtractedData(id: string): Promise<{
  documentId: string;
  documentType: string;
  extractedAt?: string;
  data?: Record<string, unknown>;
}> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/extracted-data`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function approveDocuments(ids: string[]): Promise<{
  success: boolean;
  message: string;
  approvedIds: string[];
  timestamp: string;
}> {
  const res = await fetch(`${API_BASE_URL}/documents/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function rejectDocuments(
  ids: string[],
  reason?: string,
): Promise<{
  success: boolean;
  message: string;
  rejectedIds: string[];
  reason: string;
  timestamp: string;
}> {
  const res = await fetch(`${API_BASE_URL}/documents/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, reason }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchSettings(): Promise<Settings> {
  const res = await fetch(`${API_BASE_URL}/settings`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function updateSettings(
  settings: Partial<Settings>,
): Promise<{
  success: boolean;
  message: string;
  settings: Settings;
}> {
  const res = await fetch(`${API_BASE_URL}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchUsers(): Promise<{
  total: number;
  users: User[];
}> {
  const res = await fetch(`${API_BASE_URL}/users`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function createUser(user: {
  email: string;
  name: string;
  role: "admin" | "operator" | "viewer";
}): Promise<{
  success: boolean;
  message: string;
  user: User;
}> {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function updateUser(
  id: string,
  updates: { name?: string; role?: string; isActive?: boolean },
): Promise<{
  success: boolean;
  message: string;
  user: User;
}> {
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchAuditLog(params?: {
  userId?: string;
  action?: string;
  resourceType?: string;
}): Promise<{
  total: number;
  auditLogs: AuditLog[];
}> {
  const url = new URL(`${API_BASE_URL}/audit-log`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ============================================================================
// Health Check
// ============================================================================

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/documents`, {
      method: "GET",
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return res.ok;
  } catch {
    return false;
  }
}
