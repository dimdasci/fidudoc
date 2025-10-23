import { UsersHeader } from "@features/users/components/UsersHeader";
import {
  UsersTable,
  type UsersTableRow,
} from "@features/users/components/UsersTable";
import { UsersToolbar } from "@features/users/components/UsersToolbar";
import { useUsersQuery } from "@features/users/hooks/useUsersQuery";
import { useI18nContext } from "@shared/i18n/i18n";
import { showToast } from "@shared/ui/toast";

export function UsersRoute() {
  const { t } = useI18nContext();
  const { users, queryResult } = useUsersQuery();

  const handleAddUser = () => {
    showToast(t("users.toast.add"), "info");
  };

  const handleEditUser = (user: UsersTableRow) => {
    showToast(t("users.toast.edit", { email: user.email }), "info");
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
    </div>
  );
}
