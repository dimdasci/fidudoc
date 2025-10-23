/**
 * Mock Data Generators - For API development and testing
 *
 * These generators create realistic mock data for the web application
 * without needing a full backend implementation.
 */

import type { AuditLog, Document, Settings, User } from "./types.ts";

// ============================================================================
// Mock Settings Generator
// ============================================================================

export function generateMockSettings(): Settings {
  return {
    intake: {
      sources: [
        {
          id: "gdrive-main",
          type: "gdrive",
          folderId: "1A2B3C4D5E6F7G8H9I0J",
          polling: "5m",
        },
        {
          id: "email-accounting",
          type: "email",
          polling: "2m",
        },
        {
          id: "portal-clients",
          type: "portal",
          polling: "15m",
        },
      ],
    },
    routing: {
      rules: [
        {
          documentType: "invoice",
          destination: "clients/{client_id}/invoices/{year}",
        },
        {
          documentType: "receipt",
          destination: "clients/{client_id}/receipts/{year}",
        },
        {
          documentType: "contract",
          destination: "clients/{client_id}/contracts",
        },
        {
          documentType: "lease",
          destination: "clients/{client_id}/leases",
        },
        {
          documentType: "tax_return",
          destination: "clients/{client_id}/tax/{year}",
        },
      ],
    },
    queryTemplates: [
      {
        name: "Last 24h Inbox",
        query: {
          status: "pending",
          period: "24h",
        },
      },
      {
        name: "Pending Approval",
        query: {
          status: "pending",
        },
      },
      {
        name: "VAT Validation Issues",
        query: {
          validation_status: "failed",
          validation_type: "vat",
        },
      },
    ],
    autoApproval: {
      enabled: true,
      minConfidence: 0.9,
    },
  };
}

// ============================================================================
// Mock Documents Generator
// ============================================================================

const CLIENT_NAMES = [
  "Acme Corporation",
  "TechStart GmbH",
  "Global Ventures Ltd",
  "Alpine Consulting AG",
  "Nordic Trading AS",
  "Mediterranean Services SRL",
];

const DOCUMENT_TYPES_LIST: Document["documentType"][] = [
  "invoice",
  "receipt",
  "contract",
  "lease",
  "tax_return",
];

function generateMockExtractedData(
  docType: Document["documentType"],
): Record<string, unknown> {
  switch (docType) {
    case "invoice":
      return {
        invoiceNumber: `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        amount: Math.round(Math.random() * 50000 * 100) / 100,
        currency: "EUR",
        vendorName: `Vendor ${Math.floor(Math.random() * 100)}`,
        vatNumber: `DE${Math.random().toString().slice(2, 11)}`,
        vatRate: [19, 7, 0][Math.floor(Math.random() * 3)],
      };
    case "receipt":
      return {
        receiptNumber: `RCP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        merchantName: `Merchant ${Math.floor(Math.random() * 50)}`,
        amount: Math.round(Math.random() * 1000 * 100) / 100,
        currency: "EUR",
      };
    case "contract":
      return {
        contractType: [
          "Service Agreement",
          "Lease Agreement",
          "Supply Contract",
        ][Math.floor(Math.random() * 3)],
        partyA: `Company ${Math.floor(Math.random() * 20)}`,
        partyB: `Company ${Math.floor(Math.random() * 20) + 20}`,
        startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        endDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      };
    case "lease":
      return {
        propertyAddress: `Street ${Math.floor(Math.random() * 100)} ${
          Math.floor(Math.random() * 10)
        }, City`,
        leaseStartDate:
          new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        leaseEndDate:
          new Date(Date.now() + Math.random() * 1825 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        monthlyRent: Math.round(Math.random() * 5000 * 100) / 100,
        currency: "EUR",
        vatApplicable: Math.random() > 0.5,
      };
    case "tax_return":
      return {
        taxYear: new Date().getFullYear() - Math.floor(Math.random() * 3),
        taxableIncome: Math.round(Math.random() * 500000 * 100) / 100,
        taxPaid: Math.round(Math.random() * 150000 * 100) / 100,
        currency: "EUR",
        status: ["filed", "pending", "under_review"][Math.floor(Math.random() * 3)],
      };
    default:
      return { unknown: true };
  }
}

function generateMockDocument(index: number): Document {
  const clientName = CLIENT_NAMES[index % CLIENT_NAMES.length] || "Unknown Client";
  const selectedType = DOCUMENT_TYPES_LIST[index % DOCUMENT_TYPES_LIST.length];
  const docType: Document["documentType"] = selectedType || "unknown";
  const createdDays = Math.floor(Math.random() * 60);
  const uploadedAt = new Date(Date.now() - createdDays * 24 * 60 * 60 * 1000);
  const inspectionType = docType === "invoice"
    ? "vat"
    : docType === "lease"
    ? "lease_vat"
    : null;

  return {
    id: `doc-${String(index + 1).padStart(5, "0")}`,
    fileName: `${docType}_${uploadedAt.getFullYear()}_${
      String(index).padStart(3, "0")
    }.pdf`,
    documentType: docType,
    status: Math.random() > 0.3 ? "approved" : "pending",
    validation_status: Math.random() > 0.15 ? "passed" : "failed",
    client_id: `client-${String((index % 6) + 1).padStart(3, "0")}`,
    clientName,
    confidence: Math.round((0.75 + Math.random() * 0.25) * 100) / 100,
    uploadedAt: uploadedAt.toISOString(),
    processedAt: Math.random() > 0.2
      ? new Date(uploadedAt.getTime() + 30 * 60 * 1000).toISOString()
      : undefined,
    pdfStoragePath: `storage/clients/${
      (index % 6) + 1
    }/${docType}s/${uploadedAt.getFullYear()}/${index}.pdf`,
    jsonStoragePath: docType !== "receipt"
      ? `storage/clients/${
        (index % 6) + 1
      }/${docType}s/${uploadedAt.getFullYear()}/${index}.json`
      : undefined,
    extractedData: generateMockExtractedData(docType),
    inspectionType,
  };
}

export function generateMockDocuments(count: number = 12): Document[] {
  const documents: Document[] = [];
  for (let i = 0; i < count; i++) {
    documents.push(generateMockDocument(i));
  }
  return documents;
}

// ============================================================================
// Mock Users Generator
// ============================================================================

const USER_NAMES = [
  { name: "Anna Mueller", email: "anna.mueller@fidudoc.com" },
  { name: "Bert Schmidt", email: "bert.schmidt@fidudoc.com" },
  { name: "Clara Weber", email: "clara.weber@fidudoc.com" },
  { name: "David Fischer", email: "david.fischer@fidudoc.com" },
  { name: "Eva Keller", email: "eva.keller@fidudoc.com" },
  { name: "Frank Richter", email: "frank.richter@fidudoc.com" },
  { name: "Greta Bauer", email: "greta.bauer@fidudoc.com" },
  { name: "Hans Meier", email: "hans.meier@fidudoc.com" },
];

const ROLE_PERMISSIONS: Record<User["role"], string[]> = {
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

function generateMockUser(index: number): User {
  const userInfo = USER_NAMES[index % USER_NAMES.length]
    || { name: "Unknown", email: "unknown@example.com" };
  const role: User["role"] = [
    "admin",
    "operator",
    "operator",
    "viewer",
  ][index % 4] as User["role"];

  const createdDays = Math.floor(Math.random() * 180);
  const createdAt = new Date(Date.now() - createdDays * 24 * 60 * 60 * 1000);
  const lastLoginDays = Math.floor(Math.random() * 30);
  const lastLogin = lastLoginDays > 7
    ? undefined
    : new Date(Date.now() - lastLoginDays * 24 * 60 * 60 * 1000);

  const permissions = ROLE_PERMISSIONS[role] || [];

  return {
    id: `user-${String(index + 1).padStart(3, "0")}`,
    email: userInfo.email,
    name: userInfo.name,
    role,
    permissions,
    createdAt: createdAt.toISOString(),
    lastLogin: lastLogin?.toISOString(),
    isActive: Math.random() > 0.15,
  };
}

export function generateMockUsers(count: number = 8): User[] {
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    users.push(generateMockUser(i));
  }
  return users;
}

// ============================================================================
// Mock Audit Log Generator
// ============================================================================

export function generateMockAuditLog(): AuditLog[] {
  return [
    {
      id: "audit-001",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      userId: "user-001",
      userName: "Anna Mueller",
      action: "document_approved",
      resourceType: "document",
      resourceId: "doc-00001",
      details: { status: "pending", newStatus: "approved" },
    },
    {
      id: "audit-002",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      userId: "user-002",
      userName: "Bert Schmidt",
      action: "document_rejected",
      resourceType: "document",
      resourceId: "doc-00002",
      details: { reason: "Invalid VAT number" },
    },
    {
      id: "audit-003",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      userId: "user-003",
      userName: "Clara Weber",
      action: "user_created",
      resourceType: "user",
      resourceId: "user-008",
      details: { name: "Hans Meier", role: "operator" },
    },
    {
      id: "audit-004",
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      userId: "user-001",
      userName: "Anna Mueller",
      action: "settings_updated",
      resourceType: "settings",
      resourceId: "settings",
      details: { section: "autoApproval", minConfidence: 0.9 },
    },
    {
      id: "audit-005",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      userId: "user-002",
      userName: "Bert Schmidt",
      action: "entities_merged",
      resourceType: "entity",
      resourceId: "entity-5",
      details: { mergedWith: "entity-12", type: "company" },
    },
  ];
}
