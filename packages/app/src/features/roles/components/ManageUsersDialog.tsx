import { Button } from "@shared/ui/Button/Button";
import { Dialog } from "@shared/ui/Dialog";
import {
  SelectItem,
  SelectPopup,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/Select";
import { Loader, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRoleUsers } from "../hooks/useRoleUsers";
import { formatRoleName } from "../lib/formatters";

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

interface ManageUsersDialogProps {
  open: boolean;
  onClose: () => void;
  roleName: string;
  accountId: string;
  t: TranslateFn;
}

export function ManageUsersDialog({
  open,
  onClose,
  roleName,
  accountId,
  t,
}: ManageUsersDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const {
    availableUsers,
    assignedUsersWithDetails,
    isLoading,
    assignUser,
    removeUser,
    isAssigning,
    isRemoving,
    invalidateRolesList,
  } = useRoleUsers({
    accountId,
    roleName,
    enabled: open,
    t,
  });

  // Clear selection if the selected user is no longer available
  useEffect(() => {
    if (selectedUserId && !availableUsers.some(user => user.id === selectedUserId)) {
      setSelectedUserId("");
    }
  }, [selectedUserId, availableUsers]);

  const handleAssignUser = () => {
    if (selectedUserId) {
      assignUser(selectedUserId);
    }
  };

  const handleRemoveUser = (userId: string) => {
    removeUser(userId);
  };

  const handleClose = () => {
    // Invalidate roles list to update user counts before closing
    invalidateRolesList();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title={t("roles.users.dialog.title", { roleName: formatRoleName(roleName) })}
      footer={
        <Button onClick={handleClose} variant="secondary">
          {t("roles.dialog.close")}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Current Users Section */}
        <div>
          <h3 className="text-body font-semibold text-heading mb-3">
            {t("roles.users.dialog.currentUsers")}
          </h3>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader size={20} className="animate-spin text-secondary" />
            </div>
          )}

          {!isLoading && assignedUsersWithDetails.length === 0 && (
            <div className="text-body-sm text-secondary py-4 text-center border border-subtle rounded-lg">
              {t("roles.users.empty")}
            </div>
          )}

          {!isLoading && assignedUsersWithDetails.length > 0 && (
            <div className="border border-subtle rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-bg">
                  <tr>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                      {t("roles.users.user")}
                    </th>
                    <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                      {t("roles.users.email")}
                    </th>
                    <th className="px-4 py-3 text-right text-body-sm font-semibold text-primary w-24">
                      {t("roles.users.remove")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignedUsersWithDetails.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-subtle"
                    >
                      <td className="px-4 py-3 text-body-sm text-primary">
                        {user.displayName}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-secondary">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={isRemoving}
                          className="p-2 text-error hover:bg-error/10 rounded transition-colors disabled:opacity-50"
                          title={t("roles.users.remove")}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User Section */}
        {!isLoading && availableUsers.length > 0 && (
          <div>
            <h3 className="text-body font-semibold text-heading mb-3">
              {t("roles.users.dialog.addUser")}
            </h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label
                  htmlFor="user-select"
                  className="block text-body-sm font-medium text-primary mb-2"
                >
                  {t("roles.users.selectUser")}
                </label>
                <SelectRoot
                  key={`select-${availableUsers.length}-${
                    availableUsers.map(u => u.id).join("-")
                  }`}
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={isAssigning}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("roles.users.selectUserPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectPopup>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.displayName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </SelectRoot>
              </div>
              <Button
                onClick={handleAssignUser}
                disabled={!selectedUserId || isAssigning}
                variant="primary"
                size="md"
              >
                <Plus size={16} className="mr-2" />
                {t("roles.users.add")}
              </Button>
            </div>
          </div>
        )}

        {!isLoading && availableUsers.length === 0
          && assignedUsersWithDetails.length > 0 && (
          <div className="text-body-sm text-secondary py-4 text-center border border-subtle rounded-lg">
            {t("roles.users.allUsersAssigned")}
          </div>
        )}
      </div>
    </Dialog>
  );
}
