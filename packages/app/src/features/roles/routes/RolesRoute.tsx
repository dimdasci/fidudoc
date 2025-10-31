import { useAuth } from "@features/auth";
import { useI18nContext } from "@shared/i18n/i18n";
import { useState } from "react";
import { ManagePermissionsDialog } from "../components/ManagePermissionsDialog";
import { ManageUsersDialog } from "../components/ManageUsersDialog";
import { RolesHeader } from "../components/RolesHeader";
import { RolesTable } from "../components/RolesTable";
import { useRolesQuery } from "../hooks/useRolesQuery";

export function RolesRoute() {
  const { t } = useI18nContext();
  const { authState } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [manageUsersRole, setManageUsersRole] = useState<string | null>(null);

  // Get accountId from auth context
  const accountId = authState.status === "authenticated"
    ? authState.session.user.accountId
    : null;

  // Fetch roles
  const { data, isLoading, error } = useRolesQuery(accountId);

  const handleManagePermissions = (roleName: string) => {
    setSelectedRole(roleName);
  };

  const handleManageUsers = (roleName: string) => {
    setManageUsersRole(roleName);
  };

  const handleCloseDialog = () => {
    setSelectedRole(null);
  };

  const handleCloseUsersDialog = () => {
    setManageUsersRole(null);
  };

  return (
    <div className="flex flex-col h-full">
      <RolesHeader t={t} />

      <div className="flex-1 overflow-hidden">
        <RolesTable
          roles={data || []}
          loading={isLoading}
          error={error ? t("roles.error") : null}
          onManagePermissions={handleManagePermissions}
          onManageUsers={handleManageUsers}
          t={t}
        />
      </div>

      {/* Manage Permissions Dialog */}
      {selectedRole && accountId && (
        <ManagePermissionsDialog
          open={!!selectedRole}
          onClose={handleCloseDialog}
          roleName={selectedRole}
          accountId={accountId}
          t={t}
        />
      )}

      {/* Manage Users Dialog */}
      {manageUsersRole && accountId && (
        <ManageUsersDialog
          open={!!manageUsersRole}
          onClose={handleCloseUsersDialog}
          roleName={manageUsersRole}
          accountId={accountId}
          t={t}
        />
      )}
    </div>
  );
}
