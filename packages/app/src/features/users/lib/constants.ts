export const USER_ROLE_META: Record<
  string,
  { colorClass: string; labelKey: string }
> = {
  admin: {
    colorClass: "text-error",
    labelKey: "users.roles.admin",
  },
  operator: {
    colorClass: "text-success",
    labelKey: "users.roles.operator",
  },
  viewer: {
    colorClass: "text-secondary",
    labelKey: "users.roles.viewer",
  },
};
