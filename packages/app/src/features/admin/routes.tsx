import { useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useI18nContext } from "../../i18n/i18n";
import { fetchUsers } from "../../services/api";
import { Button } from "../../ui/Button/Button";
import { Table, type TableColumn } from "../../ui/Table";
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

// Main Users Route Component
export function AdminRoute() {
  const { t } = useI18nContext();

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
        <span className="text-body-sm text-primary">
          {String(value)}
        </span>
      ),
    },
    {
      key: "email",
      label: t("admin.col.email"),
      render: (value) => (
        <span className="text-body-sm text-primary">
          {String(value)}
        </span>
      ),
    },
    {
      key: "role",
      label: t("admin.col.role"),
      render: (value) => {
        const role = String(value);
        const colorClass = role === "admin"
          ? "text-error"
          : role === "operator"
          ? "text-success"
          : "text-secondary";
        return (
          <span className={`text-body-sm font-medium ${colorClass}`}>
            {getRoleLabel(role, t)}
          </span>
        );
      },
    },
    {
      key: "isActive",
      label: t("admin.col.status"),
      render: (value) => {
        const isActive = Boolean(value);
        const colorClass = isActive ? "text-success" : "text-secondary";
        return (
          <span className={`text-body-sm font-medium ${colorClass}`}>
            {isActive ? t("admin.active") : t("admin.inactive")}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: t("admin.col.created"),
      render: (value) => (
        <span className="text-body-sm text-secondary tabular-nums">
          {formatDateTime(String(value))}
        </span>
      ),
    },
    {
      key: "lastLogin",
      label: t("admin.col.lastLogin"),
      render: (value) => (
        <span className="text-body-sm text-secondary tabular-nums">
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
    <div className="mb-6">
      <div className="space-y-1">
        <h2 className="text-headline font-semibold text-primary">
          {t("admin.users")}
        </h2>
        <p className="text-body text-secondary">
          Manage user accounts and permissions
        </p>
      </div>
    </div>
  );

  const tableHeaderActions = (
    <div className="flex justify-end mb-6">
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
    <div className="flex flex-col h-full">
      {headerActions}

      <div className="flex-1 overflow-hidden">
        <Table
          columns={columns}
          data={users}
          loading={isLoading}
          error={error ? "Error loading users. Please try again." : null}
          emptyMessage="No users found"
          loadingMessage={t("admin.users")}
          headerActions={tableHeaderActions}
        />
      </div>
    </div>
  );
}
