import type { User } from "@features/users/api/users.api";
import { formatDateTime, getRoleMeta } from "@features/users/lib/formatters";
import { Button } from "@shared/ui/Button/Button";
import { Table, type TableColumn } from "@shared/ui/Table";
import type { ReactNode } from "react";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export type UsersTableRow = User;

interface UsersTableProps {
  users: UsersTableRow[];
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  loadingMessage: string;
  headerActions?: ReactNode;
  onEditUser: (user: UsersTableRow) => void;
  t: TranslateFn;
}

export function UsersTable({
  users,
  loading,
  error,
  emptyMessage,
  loadingMessage,
  headerActions,
  onEditUser,
  t,
}: UsersTableProps) {
  const columns: TableColumn<UsersTableRow>[] = [
    {
      key: "name",
      label: t("users.table.name"),
      render: (value) => (
        <span className="text-body-sm text-primary">{String(value)}</span>
      ),
    },
    {
      key: "email",
      label: t("users.table.email"),
      render: (value) => (
        <span className="text-body-sm text-primary">{String(value)}</span>
      ),
    },
    {
      key: "role",
      label: t("users.table.role"),
      render: (_value, row) => {
        const { colorClass, label } = getRoleMeta(row.role, t);
        return (
          <span className={`text-body-sm font-medium ${colorClass}`}>{label}</span>
        );
      },
    },
    {
      key: "isActive",
      label: t("users.table.status"),
      render: (_value, row) => {
        const isActive = Boolean(row.isActive);
        const colorClass = isActive ? "text-success" : "text-secondary";
        return (
          <span className={`text-body-sm font-medium ${colorClass}`}>
            {isActive ? t("users.status.active") : t("users.status.inactive")}
          </span>
        );
      },
    },
    {
      key: "createdAt",
      label: t("users.table.created"),
      render: (value) => (
        <span className="text-body-sm text-secondary tabular-nums">
          {formatDateTime(String(value))}
        </span>
      ),
    },
    {
      key: "lastLogin",
      label: t("users.table.lastLogin"),
      render: (value) => (
        <span className="text-body-sm text-secondary tabular-nums">
          {formatDateTime(value ? String(value) : undefined)}
        </span>
      ),
    },
    {
      key: "id",
      label: t("users.table.actions"),
      render: (_value, row) => (
        <Button onClick={() => onEditUser(row)} variant="secondary" size="sm">
          {t("users.actions.edit")}
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={users}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
      loadingMessage={loadingMessage}
      headerActions={headerActions}
    />
  );
}
