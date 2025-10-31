import { useAuth } from "@features/auth";
import { UserDialog } from "@features/users/components/UserDialog";
import { UsersHeader } from "@features/users/components/UsersHeader";
import {
  UsersTable,
  type UsersTableRow,
} from "@features/users/components/UsersTable";
import { UsersToolbar } from "@features/users/components/UsersToolbar";
import { useUserMutations } from "@features/users/hooks/useUserMutations";
import { useUsersQuery } from "@features/users/hooks/useUsersQuery";
import { useI18nContext } from "@shared/i18n/i18n";
import { useState } from "react";
import type { CreateUserData, UpdateUserData } from "../api/users.api";

export function UsersRoute() {
  const { t } = useI18nContext();
  const { authState } = useAuth();

  // Dialog state
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: "create" | "edit";
    user: UsersTableRow | null;
  }>({ open: false, mode: "create", user: null });

  // Get accountId from auth context
  const accountId: string | null = authState.status === "authenticated"
    ? (authState.session.user.accountId ?? null)
    : null;

  // Queries and mutations
  const { users, queryResult } = useUsersQuery(accountId);
  const mutations = useUserMutations(accountId || "", t);

  const handleAddUser = () => {
    setDialogState({ open: true, mode: "create", user: null });
  };

  const handleEditUser = (user: UsersTableRow) => {
    setDialogState({ open: true, mode: "edit", user });
  };

  const handleCloseDialog = () => {
    setDialogState({ open: false, mode: "create", user: null });
  };

  const handleSubmit = (data: CreateUserData | UpdateUserData) => {
    if (dialogState.mode === "create") {
      mutations.createUser(data as CreateUserData);
    } else if (dialogState.user) {
      mutations.updateUser({
        id: dialogState.user.id,
        data: data as UpdateUserData,
      });
    }
    // Close dialog after submission
    handleCloseDialog();
  };

  return (
    <div className="flex flex-col h-full">
      <UsersHeader
        title={t("users.title")}
        subtitle={t("users.subtitle")}
      />

      <div className="flex-1 overflow-hidden">
        <UsersTable
          users={users}
          loading={queryResult.isLoading}
          error={queryResult.error ? t("users.error") : null}
          emptyMessage={t("users.empty")}
          loadingMessage={t("users.loading")}
          headerActions={<UsersToolbar onAddUser={handleAddUser} t={t} />}
          onEditUser={handleEditUser}
          t={t}
        />
      </div>

      {/* User Dialog */}
      <UserDialog
        open={dialogState.open}
        onClose={handleCloseDialog}
        mode={dialogState.mode}
        user={dialogState.user || undefined}
        onSubmit={handleSubmit}
        isSubmitting={mutations.isCreating || mutations.isUpdating}
        t={t}
      />
    </div>
  );
}
