import { Button } from "@shared/ui/Button/Button";
import { Table, type TableColumn } from "@shared/ui/Table";
import type { RoleWithStats } from "../api/roles.types";
import { formatRoleName } from "../lib/formatters";

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

interface RolesTableProps {
  roles: RoleWithStats[];
  loading: boolean;
  error: string | null;
  onManagePermissions: (role: string) => void;
  onManageUsers: (role: string) => void;
  t: TranslateFn;
}

export function RolesTable({
  roles,
  loading,
  error,
  onManagePermissions,
  onManageUsers,
  t,
}: RolesTableProps) {
  const columns: TableColumn<RoleWithStats>[] = [
    {
      key: "role",
      label: t("roles.table.role"),
      render: (_, row) => (
        <span className="text-body-sm text-primary font-medium">
          {formatRoleName(row.role)}
        </span>
      ),
    },
    {
      key: "userCount",
      label: t("roles.table.users"),
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-3">
          <span
            className="text-body-sm text-primary"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {row.userCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onManageUsers(row.role)}
          >
            {t("roles.actions.manage")}
          </Button>
        </div>
      ),
    },
    {
      key: "permissionCount",
      label: t("roles.table.permissions"),
      align: "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-3">
          <span
            className="text-body-sm text-primary"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {row.permissionCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onManagePermissions(row.role)}
            disabled={row.userCount === 0}
          >
            {t("roles.actions.manage")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={roles}
      loading={loading}
      error={error}
      emptyMessage={t("roles.empty")}
    />
  );
}
