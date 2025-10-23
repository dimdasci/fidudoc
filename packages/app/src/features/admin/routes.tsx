import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronDown, ChevronUp, Loader, UserPlus } from "lucide-react";
import React, { useState } from "react";
import { useI18nContext } from "../../i18n/i18n";
import { fetchAuditLog, fetchUsers } from "../../services/api";
import { Button } from "../../ui/Button/Button";
import { Table, TableBadge, type TableColumn } from "../../ui/Table";
import { showToast } from "../../ui/toast";

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

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  [key: string]: unknown;
}

interface AuditLogRow {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: unknown;
  [key: string]: unknown;
}

// Users Tab Component
function UsersTab({ t }: { t: (key: string) => string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const users = (data?.users || []) as unknown as UserRow[];

  const handleAddUser = () => {
    showToast("User creation initiated", "info");
  };

  const handleEditUser = () => {
    showToast("User edit initiated", "info");
  };

  const columns: TableColumn<UserRow>[] = [
    {
      key: "name",
      label: t("admin.col.name"),
      render: (value) => (
        <span>
          {String(value)}
        </span>
      ),
    },
    {
      key: "email",
      label: t("admin.col.email"),
      render: (value) => (
        <span>
          {String(value)}
        </span>
      ),
    },
    {
      key: "role",
      label: t("admin.col.role"),
      render: (value) => {
        const role = String(value);
        const variant = getRoleBadgeVariant(role) === "success"
          ? "success"
          : getRoleBadgeVariant(role) === "warning"
          ? "warning"
          : "default";
        return (
          <TableBadge variant={variant}>
            {getRoleLabel(role, t)}
          </TableBadge>
        );
      },
    },
    {
      key: "isActive",
      label: t("admin.col.status"),
      render: (value) => {
        const isActive = Boolean(value);
        return (
          <TableBadge variant={isActive ? "success" : "default"}>
            {isActive ? t("admin.active") : t("admin.inactive")}
          </TableBadge>
        );
      },
    },
    {
      key: "createdAt",
      label: t("admin.col.created"),
      render: (value) => (
        <span>
          {formatDateTime(String(value))}
        </span>
      ),
    },
    {
      key: "lastLogin",
      label: t("admin.col.lastLogin"),
      render: (value) => (
        <span>
          {formatDateTime(String(value || ""))}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: () => (
        <Button onClick={handleEditUser} variant="secondary" size="sm">
          Edit
        </Button>
      ),
    },
  ];

  const headerActions = (
    <div>
      <div>
        <h3>
          {t("admin.users")}
        </h3>
        <p>
          Manage user accounts and permissions
        </p>
      </div>
      <Button
        onClick={handleAddUser}
        variant="primary"
        size="sm"
        icon={<UserPlus size={16} />}
      >
        Add User
      </Button>
    </div>
  );

  return (
    <div>
      <Table
        columns={columns}
        data={users}
        loading={isLoading}
        error={error ? "Error loading users. Please try again." : null}
        emptyMessage="No users found"
        loadingMessage={t("admin.users")}
        headerActions={headerActions}
      />
    </div>
  );
}

// Audit Log Tab Component
function AuditLogTab({ t }: { t: (key: string) => string }) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["auditLog"],
    queryFn: () => fetchAuditLog(),
  });

  const auditLogs = (data?.auditLogs || []) as unknown as AuditLogRow[];

  const toggleDetails = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const headerActions = (
    <div>
      <h3>
        {t("admin.audit")}
      </h3>
      <p>
        View system activity and user actions
      </p>
    </div>
  );

  // Custom table implementation needed for expandable rows
  return (
    <div>
      {headerActions}

      {/* Table */}
      <div>
        {isLoading
          ? (
            <div>
              <Loader size={24} />
              <span>
                Loading audit log...
              </span>
            </div>
          )
          : error
          ? (
            <div>
              <AlertCircle size={24} />
              Error loading audit log. Please try again.
            </div>
          )
          : auditLogs.length === 0
          ? (
            <div>
              No audit entries found
            </div>
          )
          : (
            <table>
              <thead>
                <tr>
                  <th>
                    {t("admin.col.timestamp")}
                  </th>
                  <th>
                    {t("admin.col.user")}
                  </th>
                  <th>
                    {t("admin.col.action")}
                  </th>
                  <th>
                    {t("admin.col.resource")}
                  </th>
                  <th>
                    {t("admin.col.details")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr>
                      <td>
                        <span>
                          {formatDateTime(log.timestamp)}
                        </span>
                      </td>
                      <td>
                        <span>
                          {log.userName}
                        </span>
                      </td>
                      <td>
                        <span>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span>
                            {log.resourceType}
                          </span>
                          <span>
                            {log.resourceId}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Button
                          onClick={() => toggleDetails(log.id)}
                          variant="ghost"
                          size="sm"
                          icon={expandedRow === log.id
                            ? <ChevronUp size={14} />
                            : <ChevronDown size={14} />}
                        >
                          {expandedRow === log.id ? "Hide" : "Show"}
                        </Button>
                      </td>
                    </tr>
                    {expandedRow === log.id && (
                      <tr key={`${log.id}-details`}>
                        <td colSpan={5}>
                          <pre>
                          {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}

// Main Admin Route Component
export function AdminRoute() {
  const { t } = useI18nContext();
  const [activeTab, setActiveTab] = useState("users");

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
    <div>
      {/* Header */}
      <div>
        <h2>
          {t("admin.title")}
        </h2>
        <p>
          Manage users, permissions, and system activity
        </p>
      </div>

      {/* Tabs */}
      <div>
        {/* Tab buttons */}
        <div>
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant="ghost"
              size="md"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab content */}
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
