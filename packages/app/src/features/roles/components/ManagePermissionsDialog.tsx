import { Button } from "@shared/ui/Button/Button";
import { Dialog } from "@shared/ui/Dialog";
import { Check, Loader, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { PermissionAction, PermissionObject } from "../api/roles.types";
import { useRolePermissions } from "../hooks/useRolePermissions";
import { useRolePermissionsQuery } from "../hooks/useRolePermissionsQuery";
import { formatPermission, formatRoleName } from "../lib/formatters";
import { AddPermissionForm } from "./AddPermissionForm";

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

interface ManagePermissionsDialogProps {
  open: boolean;
  onClose: () => void;
  roleName: string;
  accountId: string;
  t: TranslateFn;
}

export function ManagePermissionsDialog({
  open,
  onClose,
  roleName,
  accountId,
  t,
}: ManagePermissionsDialogProps) {
  const { data, isLoading, error } = useRolePermissionsQuery(
    accountId,
    roleName,
  );

  const {
    addPermission,
    removePermission,
    isAddingPermission,
    isRemovingPermission,
    invalidateRolesList,
  } = useRolePermissions(accountId, roleName, t);

  // State for inline delete confirmation
  const [deletingPermission, setDeletingPermission] = useState<string | null>(null);

  // Create a set of existing permissions for duplicate checking
  const existingPermissions = useMemo(() => {
    const set = new Set<string>();
    if (data?.permissions) {
      for (const perm of data.permissions) {
        set.add(`${perm.object}:${perm.action}`);
      }
    }
    return set;
  }, [data]);

  const handleAddPermission = (
    object: PermissionObject,
    action: PermissionAction,
  ) => {
    addPermission({ object, action });
  };

  const handleStartDelete = (
    object: PermissionObject,
    action: PermissionAction,
  ) => {
    const permissionKey = `${object}:${action}`;
    setDeletingPermission(permissionKey);
  };

  const handleConfirmDelete = (
    object: PermissionObject,
    action: PermissionAction,
  ) => {
    removePermission({ object, action });
    setDeletingPermission(null);
  };

  const handleCancelDelete = () => {
    setDeletingPermission(null);
  };

  const handleClose = () => {
    // Invalidate roles list to update permission counts before closing
    invalidateRolesList();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title={t("roles.dialog.title", { roleName: formatRoleName(roleName) })}
      footer={
        <Button onClick={handleClose} variant="secondary">
          {t("roles.dialog.close")}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Current Permissions Section */}
        <div>
          <h3 className="text-body font-semibold text-heading mb-3">
            {t("roles.dialog.currentPermissions")}
          </h3>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader size={20} className="animate-spin text-secondary" />
            </div>
          )}

          {error && (
            <div className="text-body-sm text-error py-4">
              {t("roles.toast.error")}
            </div>
          )}

          {!isLoading && !error && data?.permissions?.length === 0 && (
            <div className="text-body-sm text-secondary py-4 text-center border border-subtle rounded-lg">
              {t("roles.permissions.empty")}
            </div>
          )}

          {!isLoading && !error && data?.permissions && data.permissions.length > 0
            && (
              <div className="border border-subtle rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-neutral-bg">
                    <tr>
                      <th className="px-4 py-3 text-left text-body-sm font-semibold text-primary">
                        {t("roles.permissions.permission")}
                      </th>
                      <th className="px-4 py-3 text-right text-body-sm font-semibold text-primary w-24">
                        {t("roles.permissions.remove")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.permissions.map((perm) => {
                      const permissionKey = `${perm.object}:${perm.action}`;
                      const isDeleting = deletingPermission === permissionKey;

                      return (
                        <tr
                          key={permissionKey}
                          className="border-t border-subtle"
                        >
                          <td className="px-4 py-3 text-body-sm text-primary">
                            {formatPermission(perm.object, perm.action)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isDeleting
                              ? (
                                // Inline confirmation UI
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleConfirmDelete(perm.object, perm.action)}
                                    disabled={isRemovingPermission}
                                    className="p-1.5 text-error hover:bg-error/10 rounded transition-colors disabled:opacity-50"
                                    title={t("roles.permissions.confirmRemove")}
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelDelete}
                                    disabled={isRemovingPermission}
                                    className="p-1.5 text-secondary hover:bg-neutral-bg rounded transition-colors disabled:opacity-50"
                                    title={t("action.cancel")}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              )
                              : (
                                // Normal delete button
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStartDelete(perm.object, perm.action)}
                                  disabled={isRemovingPermission}
                                  className="p-2 text-error hover:bg-error/10 rounded transition-colors disabled:opacity-50"
                                  title={t("roles.permissions.remove")}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>

        {/* Add Permission Section */}
        <div>
          <h3 className="text-body font-semibold text-heading mb-3">
            {t("roles.dialog.addPermission")}
          </h3>
          <AddPermissionForm
            onAdd={handleAddPermission}
            isAdding={isAddingPermission}
            existingPermissions={existingPermissions}
            t={t}
          />
        </div>
      </div>
    </Dialog>
  );
}
