import { listUsers, type User } from "@features/users";
import { showToast } from "@shared/ui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  assignRoleToUser,
  fetchUsersForRole,
  removeRoleFromUser,
} from "../api/roles.api";
import { refreshQueryWithFreshData } from "@shared/lib/react-query/refreshQueryWithFreshData";

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

interface UseRoleUsersParams {
  accountId: string;
  roleName: string;
  enabled: boolean;
  t: TranslateFn;
}

export function useRoleUsers({
  accountId,
  roleName,
  enabled,
  t,
}: UseRoleUsersParams) {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["roles", accountId, roleName, "users"],
    queryFn: () => fetchUsersForRole(accountId, roleName),
    enabled,
  });

  const allUsersQuery = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    enabled,
  });

  const assignUserMutation = useMutation({
    mutationFn: (userId: string) => assignRoleToUser(accountId, userId, roleName),
    onSuccess: async () => {
      await refreshQueryWithFreshData(
        queryClient,
        ["roles", accountId, roleName, "users"],
        () => fetchUsersForRole(accountId, roleName, true),
      );
      showToast(t("roles.users.toast.userAssigned"), "success");
    },
    onError: () => {
      showToast(t("roles.users.toast.error"), "error");
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: (userId: string) => removeRoleFromUser(accountId, userId, roleName),
    onSuccess: async () => {
      await refreshQueryWithFreshData(
        queryClient,
        ["roles", accountId, roleName, "users"],
        () => fetchUsersForRole(accountId, roleName, true),
      );
      showToast(t("roles.users.toast.userRemoved"), "success");
    },
    onError: () => {
      showToast(t("roles.users.toast.error"), "error");
    },
  });

  const availableUsers = useMemo(() => {
    const all = allUsersQuery.data?.users;
    const assignedIds = usersQuery.data?.users;
    if (!all || !assignedIds) return [];
    const assignedSet = new Set(assignedIds);
    return all.filter(user => !assignedSet.has(user.id));
  }, [allUsersQuery.data, usersQuery.data]);

  const assignedUsersWithDetails = useMemo(() => {
    const all = allUsersQuery.data?.users;
    const assignedIds = usersQuery.data?.users;
    if (!all || !assignedIds) return [];
    const userMap = new Map(all.map(user => [user.id, user]));
    return assignedIds
      .map(userId => userMap.get(userId))
      .filter((user): user is User => user !== undefined);
  }, [allUsersQuery.data, usersQuery.data]);

  const invalidateRolesList = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["roles", accountId],
      exact: true,
    });
  }, [accountId, queryClient]);

  return {
    availableUsers,
    assignedUsersWithDetails,
    isLoading: usersQuery.isLoading || allUsersQuery.isLoading,
    assignUser: assignUserMutation.mutate,
    removeUser: removeUserMutation.mutate,
    isAssigning: assignUserMutation.isPending,
    isRemoving: removeUserMutation.isPending,
    invalidateRolesList,
  };
}
