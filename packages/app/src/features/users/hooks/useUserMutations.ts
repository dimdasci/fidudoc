import { refreshQueryWithFreshData } from "@shared/lib/react-query/refreshQueryWithFreshData";
import { showToast } from "@shared/ui/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUser,
  listUsers,
  updateUser,
  type CreateUserData,
  type UpdateUserData,
  type User,
} from "../api/users.api";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/**
 * Hook for managing user mutations (create/update)
 */
export function useUserMutations(accountId: string, t: TranslateFn) {
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserData) => createUser(accountId, data),
    onSuccess: async () => {
      await refreshQueryWithFreshData(
        queryClient,
        ["users", accountId],
        () => listUsers(accountId, true),
      );
      showToast(t("users.toast.created"), "success");
    },
    onError: () => {
      showToast(t("users.toast.createError"), "error");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      updateUser(accountId, id, data),
    onSuccess: async (user: User) => {
      await refreshQueryWithFreshData(
        queryClient,
        ["users", accountId],
        () => listUsers(accountId, true),
      );
      showToast(t("users.toast.updated", { email: user.email }), "success");
    },
    onError: () => {
      showToast(t("users.toast.updateError"), "error");
    },
  });

  return {
    createUser: createUserMutation.mutate,
    updateUser: updateUserMutation.mutate,
    isCreating: createUserMutation.isPending,
    isUpdating: updateUserMutation.isPending,
  };
}
