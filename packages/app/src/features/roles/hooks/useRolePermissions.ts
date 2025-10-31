import { showToast } from "@shared/ui/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPermission, fetchRolePermissions, removePermission } from "../api/roles.api";
import type {
  AddPermissionRequest,
  RemovePermissionRequest,
  RolePermissionsResponse,
} from "../api/roles.types";
import { refreshQueryWithFreshData } from "@shared/lib/react-query/refreshQueryWithFreshData";

/**
 * Hook for managing role permissions (add/remove)
 */
export function useRolePermissions(
  accountId: string,
  roleName: string,
  t: (key: string) => string,
) {
  const queryClient = useQueryClient();

  const addPermissionMutation = useMutation({
    mutationFn: (permission: AddPermissionRequest) =>
      addPermission(accountId, roleName, permission),
    onSuccess: async () => {
      await refreshQueryWithFreshData(
        queryClient,
        ["roles", accountId, roleName, "permissions"],
        () => fetchRolePermissions(accountId, roleName, true),
      );
      // Don't invalidate roles list here - handled when the dialog closes
      showToast(t("roles.toast.permissionAdded"), "success");
    },
    onError: () => {
      showToast(t("roles.toast.error"), "error");
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: (permission: RemovePermissionRequest) =>
      removePermission(accountId, roleName, permission),
    onMutate: async (permission: RemovePermissionRequest) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({
        queryKey: ["roles", accountId, roleName, "permissions"],
      });

      // Snapshot the previous value
      const previousPermissions = queryClient.getQueryData([
        "roles",
        accountId,
        roleName,
        "permissions",
      ]);

      // Optimistically update to remove the permission
      queryClient.setQueryData<RolePermissionsResponse>(
        ["roles", accountId, roleName, "permissions"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            permissions: old.permissions.filter(
              (p) =>
                !(p.object === permission.object && p.action === permission.action),
            ),
          };
        },
      );

      // Return a context object with the snapshotted value
      return { previousPermissions };
    },
    onError: (_err, _permission, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPermissions) {
        queryClient.setQueryData(
          ["roles", accountId, roleName, "permissions"],
          context.previousPermissions,
        );
      }
      showToast(t("roles.toast.error"), "error");
    },
    onSettled: async () => {
      await refreshQueryWithFreshData(
        queryClient,
        ["roles", accountId, roleName, "permissions"],
        () => fetchRolePermissions(accountId, roleName, true),
      );
      // Don't invalidate roles list here - handled when the dialog closes
    },
    onSuccess: () => {
      showToast(t("roles.toast.permissionRemoved"), "success");
    },
  });

  const invalidateRolesList = () => {
    // Invalidate roles list to update permission counts when dialog closes
    try {
      queryClient.invalidateQueries({
        queryKey: ["roles", accountId],
        exact: true,
      });
    } catch (error) {
      console.warn("Failed to invalidate roles list:", error);
    }
  };

  return {
    addPermission: addPermissionMutation.mutate,
    removePermission: removePermissionMutation.mutate,
    isAddingPermission: addPermissionMutation.isPending,
    isRemovingPermission: removePermissionMutation.isPending,
    invalidateRolesList,
  };
}
