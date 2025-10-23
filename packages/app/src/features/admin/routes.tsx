import { useQuery } from "@tanstack/react-query";
import { Loader, AlertCircle, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { fetchUsers, fetchAuditLog } from "../../services/api";
import { useI18nContext } from "../../i18n/i18n";
import {
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  showToast,
} from "../../ui/primitives";

// Color system
const colors = {
  light: {
    bg: "#f9fafb",
    bgSecondary: "#ffffff",
    text: "#111827",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    green: "#15803d",
    red: "#ef4444",
    amber: "#f59e0b",
    blueLight: "#eff6ff",
  },
  dark: {
    bg: "#111827",
    bgSecondary: "#1f2937",
    text: "#f3f4f6",
    textSecondary: "#9ca3af",
    border: "#374151",
    green: "#22c55e",
    red: "#f87171",
    amber: "#fbbf24",
    blueLight: "#0f172a",
  },
};

const isDark = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const getColors = () => (isDark() ? colors.dark : colors.light);

// Helper functions
function formatDateTime(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function getRoleBadgeVariant(
  role: string,
): "success" | "warning" | "error" | "default" {
  switch (role) {
    case "admin":
      return "error";
    case "operator":
      return "success";
    case "viewer":
      return "default";
    default:
      return "default";
  }
}

function getRoleLabel(role: string, t: (key: string) => string): string {
  const roleMap: Record<string, string> = {
    admin: "admin.active",
    operator: "admin.active",
    viewer: "admin.inactive",
  };
  const key = roleMap[role];
  return key ? t(key) : role;
}

function getStatusBadgeVariant(
  isActive: boolean,
): "success" | "warning" | "error" | "default" {
  return isActive ? "success" : "default";
}

// Users Tab Component
function UsersTab({ t }: { t: (key: string) => string }) {
  const c = getColors();

  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const users = data?.users || [];

  const handleAddUser = () => {
    showToast("User creation initiated", "info");
  };

  const handleEditUser = () => {
    showToast("User edit initiated", "info");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              color: c.text,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {t("admin.users")}
          </h3>
          <p
            style={{
              margin: "4px 0 0 0",
              fontSize: "13px",
              color: c.textSecondary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            Manage user accounts and permissions
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleAddUser}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <UserPlus size={16} />
            Add User
          </div>
        </Button>
      </div>

      {/* Table */}
      <div
        style={{
          overflow: "auto",
          background: c.bgSecondary,
          border: `1px solid ${c.border}`,
          borderRadius: "8px",
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              color: c.textSecondary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Loader
              size={24}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span style={{ marginLeft: "12px" }}>
              {t("admin.users")}
            </span>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              color: c.red,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <AlertCircle size={24} style={{ marginRight: "12px" }} />
            Error loading users. Please try again.
          </div>
        ) : users.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              color: c.textSecondary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            No users found
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell header>{t("admin.col.name")}</TableCell>
                <TableCell header>{t("admin.col.email")}</TableCell>
                <TableCell header>{t("admin.col.role")}</TableCell>
                <TableCell header>{t("admin.col.status")}</TableCell>
                <TableCell header>{t("admin.col.created")}</TableCell>
                <TableCell header>{t("admin.col.lastLogin")}</TableCell>
                <TableCell header>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <span
                      style={{
                        fontWeight: 500,
                        fontFamily: "Inter, sans-serif",
                        color: c.text,
                      }}
                    >
                      {user.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        color: c.textSecondary,
                      }}
                    >
                      {user.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role, t)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.isActive)}>
                      {user.isActive ? t("admin.active") : t("admin.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        color: c.textSecondary,
                      }}
                    >
                      {formatDateTime(user.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        color: c.textSecondary,
                      }}
                    >
                      {formatDateTime(user.lastLogin || "")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleEditUser}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// Audit Log Tab Component
function AuditLogTab({ t }: { t: (key: string) => string }) {
  const c = getColors();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["auditLog"],
    queryFn: () => fetchAuditLog(),
  });

  const auditLogs = data?.auditLogs || [];

  const toggleDetails = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: 600,
            color: c.text,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {t("admin.audit")}
        </h3>
        <p
          style={{
            margin: "4px 0 0 0",
            fontSize: "13px",
            color: c.textSecondary,
            fontFamily: "Inter, sans-serif",
          }}
        >
          View system activity and user actions
        </p>
      </div>

      {/* Table */}
      <div
        style={{
          overflow: "auto",
          background: c.bgSecondary,
          border: `1px solid ${c.border}`,
          borderRadius: "8px",
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              color: c.textSecondary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Loader
              size={24}
              style={{ animation: "spin 1s linear infinite" }}
            />
            <span style={{ marginLeft: "12px" }}>
              {t("admin.audit")}
            </span>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : error ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              color: c.red,
              fontFamily: "Inter, sans-serif",
            }}
          >
            <AlertCircle size={24} style={{ marginRight: "12px" }} />
            Error loading audit log. Please try again.
          </div>
        ) : auditLogs.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px",
              color: c.textSecondary,
              fontFamily: "Inter, sans-serif",
            }}
          >
            No audit entries found
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell header>{t("admin.col.timestamp")}</TableCell>
                <TableCell header>{t("admin.col.user")}</TableCell>
                <TableCell header>{t("admin.col.action")}</TableCell>
                <TableCell header>{t("admin.col.resource")}</TableCell>
                <TableCell header>{t("admin.col.details")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {auditLogs.map((log: any) => (
                <tbody key={log.id}>
                  <TableRow>
                    <TableCell>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          color: c.textSecondary,
                        }}
                      >
                        {formatDateTime(log.timestamp)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          color: c.text,
                          fontWeight: 500,
                        }}
                      >
                        {log.userName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            color: c.text,
                            fontSize: "13px",
                          }}
                        >
                          {log.resourceType}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Monaco', 'Courier New', monospace",
                            color: c.textSecondary,
                            fontSize: "11px",
                          }}
                        >
                          {log.resourceId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleDetails(log.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: c.green,
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 8px",
                        }}
                      >
                        {expandedRow === log.id ? (
                          <>
                            <ChevronUp size={14} />
                            Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            Show
                          </>
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                  {expandedRow === log.id && (
                    <tr key={`${log.id}-details`}>
                      <td
                        colSpan={5}
                        style={{
                          padding: "16px",
                          background: c.blueLight,
                        }}
                      >
                        <pre
                          style={{
                            margin: 0,
                            fontFamily:
                              "'Monaco', 'Courier New', monospace",
                            fontSize: "12px",
                            color: c.text,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

// Main Admin Route Component
export function AdminRoute() {
  const { t } = useI18nContext();
  const c = getColors();

  const tabs = [
    {
      id: "users",
      label: "Users",
      content: <UsersTab t={t} />,
    },
    {
      id: "audit",
      label: "Audit",
      content: <AuditLogTab t={t} />,
    },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: 700,
            color: c.text,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {t("admin.title")}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "14px",
            color: c.textSecondary,
            fontFamily: "Inter, sans-serif",
          }}
        >
          Manage users, permissions, and system activity
        </p>
      </div>

      {/* Tabs */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <Tabs tabs={tabs} defaultTab="users" />
      </div>
    </div>
  );
}
