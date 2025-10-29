/**
 * Auth API - HTTP contract definitions
 *
 * Defines the HTTP endpoints for Role and Permission management
 */

export const AuthEndpoints = {
  // Role Discovery
  GET_ALL_ROLES: "get_all_roles",

  // Role-Permission Management
  ADD_PERMISSION_TO_ROLE: "add_permission_to_role",
  REMOVE_PERMISSION_FROM_ROLE: "remove_permission_from_role",
  GET_ROLE_PERMISSIONS: "get_role_permissions",

  // User-Role Assignment
  ASSIGN_ROLE_TO_USER: "assign_role_to_user",
  UNASSIGN_ROLE_FROM_USER: "unassign_role_from_user",
  GET_USER_ROLES: "get_user_roles",
  GET_ROLE_USERS: "get_role_users",

  // User Information
  GET_USER_INFO: "get_user_info",
  CHECK_USER_PERMISSION: "check_user_permission",

  // Domain Management
  GET_ALL_USERS_IN_DOMAIN: "get_all_users_in_domain",
} as const;
