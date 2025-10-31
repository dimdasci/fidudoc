import { Model, SqlClient } from "@effect/sql";
import { Effect, Option, pipe, Schema } from "effect";
import { AccountsService, AccountsServiceLive } from "../Accounts/Service.ts";
import { Supabase, SupabaseLive } from "../Auth/Supabase.ts";
import type { AccountId } from "../Domain/Account.ts";
import type { Email } from "../Domain/Emails.ts";
import {
  CurrentUser,
  SupabaseAuthError,
  User,
  UserEmailExists,
  type UserId,
  UserIdFromString,
  type UserJsonCreate,
  type UserJsonUpdate,
  UserNotFound,
} from "../Domain/User.ts";
import { SqlLive } from "../Sql.ts";
import { Uuid, UuidLive } from "../Uuid.ts";
import { UsersRepo, UsersRepoLive } from "./Repo.ts";

/**
 * Users Service - User management business logic
 *
 * This service orchestrates all user operations including:
 * - User lookup and retrieval (with proper error handling)
 * - User creation and updates (with validation and transactions)
 * - Account-scoped operations for multi-tenancy
 *
 * Key Design Principles:
 * - Effect-first architecture for type safety and composability
 * - Proper transaction boundaries for data consistency
 * - Domain error handling (UserNotFound, etc.)
 * - Observability through spans and structured logging
 */
export class UsersService extends Effect.Service<UsersService>()(
  "Users/Service",
  {
    dependencies: [
      SqlLive,
      UsersRepoLive,
      UuidLive,
      SupabaseLive,
      AccountsServiceLive,
    ],
    effect: Effect.gen(function*() {
      const sql = yield* SqlClient.SqlClient;
      const usersRepo = yield* UsersRepo;
      const uuid = yield* Uuid;
      const supabase = yield* Supabase;
      const accountsService = yield* AccountsService;

      // ========================================================================
      // Helper Functions
      // ========================================================================

      /**
       * Fetch auth metadata for users from Supabase Auth
       * Returns a Map of userId -> auth metadata for efficient lookup
       */
      const fetchAuthMetadataForUsers = (userIds: UserId[]) =>
        pipe(
          Effect.promise(() =>
            supabase.adminClient.auth.admin.listUsers({
              page: 1,
              perPage: 1000, // Sufficient for small fiduciary companies
            })
          ),
          Effect.map(({ data, error }) => {
            if (error || !data?.users) {
              return new Map<string, { lastSignInAt?: string }>();
            }

            // Create lookup map for our account's users
            const userIdStrings = userIds.map(id => id as string);
            const authMap = new Map<string, { lastSignInAt?: string }>();

            data.users.forEach(authUser => {
              if (userIdStrings.includes(authUser.id)) {
                authMap.set(authUser.id, {
                  lastSignInAt: authUser.last_sign_in_at || undefined,
                });
              }
            });

            return authMap;
          }),
          Effect.catchAll(() =>
            Effect.succeed(new Map<string, { lastSignInAt?: string }>())
          ),
        );

      /**
       * Create user in Supabase Auth with metadata
       * Returns the Supabase user ID or fails with SupabaseAuthError
       */
      const createSupabaseUser = (
        email: Email,
        accountId: AccountId,
        accountDisplayName: string,
        userDisplayName: string,
        userFullName: string,
      ) =>
        Effect.gen(function*() {
          const tempPassword = yield* uuid.generate;

          const { data: authData, error: authError } = yield* Effect.promise(
            () =>
              supabase.adminClient.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true, // Auto-confirm since we use OTP
                user_metadata: {
                  accountId: accountId,
                  accountDisplayName: accountDisplayName,
                  displayName: userDisplayName,
                  fullName: userFullName,
                },
              }),
          );

          if (authError) {
            return yield* Effect.fail(
              new SupabaseAuthError({
                message: authError.message,
                code: authError.status?.toString() || "unknown",
              }),
            );
          }

          if (!authData.user) {
            return yield* Effect.fail(
              new SupabaseAuthError({
                message: "Failed to create user in Supabase Auth",
                code: "no_user_data",
              }),
            );
          }

          return authData.user.id;
        }).pipe(
          Effect.catchAll((error) =>
            Effect.fail(
              new SupabaseAuthError({
                message: error instanceof Error ? error.message : "Unknown error",
                code: "network_error",
              }),
            )
          ),
        );

      // ========================================================================
      // Core User Operations
      // ========================================================================

      /**
       * Find user by ID with proper error handling
       * Returns UserNotFound if user doesn't exist or is inactive
       */
      const findById = (id: UserId) =>
        pipe(
          usersRepo.findById(id),
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.fail(new UserNotFound({ id })),
              onSome: (user) =>
                user.isActive
                  ? Effect.succeed(user)
                  : Effect.fail(new UserNotFound({ id })), // Treat inactive users as not found
            }),
          ),
          Effect.withSpan("Users.findById", { attributes: { id } }),
        );

      /**
       * Get current authenticated user from request context
       * This is provided by auth middleware via CurrentUser service
       */
      const getCurrentUser = () =>
        Effect.gen(function*() {
          const currentUser = yield* CurrentUser;
          return currentUser;
        }).pipe(
          Effect.withSpan("Users.getCurrentUser"),
        );

      /**
       * List all users in an account (multi-tenant aware)
       * Returns both active and inactive users with auth metadata (last sign in)
       */
      const listByAccount = (accountId: AccountId) =>
        Effect.gen(function*() {
          // 1. Fetch users from our domain repository
          const users = yield* usersRepo.findByAccountId(accountId);

          // 2. Fetch auth metadata for these users
          const userIds = users.map(user => user.id);
          const authMap = yield* fetchAuthMetadataForUsers(userIds);

          // 3. Enrich users with auth metadata
          const enrichedUsers = users.map(user => ({
            ...user,
            lastSignInAt: authMap.get(user.id as string)?.lastSignInAt || null,
          }));

          return {
            total: enrichedUsers.length,
            users: enrichedUsers,
          };
        }).pipe(
          Effect.withSpan("Users.listByAccount", { attributes: { accountId } }),
        );

      /**
       * Create new user with full validation and transaction safety
       *
       * Two-phase creation process:
       * 1. Create user in Supabase Auth with metadata (accountId, displayName)
       * 2. Create user record in Users table with Supabase Auth ID
       * 3. If step 2 fails, rollback step 1 by deleting Supabase Auth user
       *
       * This ensures consistency between auth system and domain data.
       */
      const create = (accountId: AccountId, data: typeof UserJsonCreate.Type) =>
        Effect.gen(function*() {
          // 1. Validate input data (Schema validation happens automatically)
          // 2. Check for duplicate email in this account
          const existingUserOption = yield* usersRepo.findByEmail(
            accountId,
            data.email,
          );

          if (existingUserOption._tag === "Some") {
            // Return a domain error for duplicate email
            return yield* Effect.fail(
              new UserEmailExists({
                email: data.email,
                accountId: accountId,
              }),
            );
          }

          // 3. Get account details for metadata
          const account = yield* accountsService.findById(accountId);

          // 4. Create user in Supabase Auth with metadata
          const supabaseUserId = yield* createSupabaseUser(
            data.email,
            accountId,
            account.displayName,
            data.displayName,
            data.fullName,
          );

          // 5. Create user in Users table with Supabase Auth ID
          const createUserInRepo = Effect.gen(function*() {
            const userId = yield* Schema.decodeUnknown(UserIdFromString)(
              supabaseUserId,
            );

            const newUser = yield* usersRepo.insert(
              User.insert.make({
                ...data,
                id: userId,
                accountId: accountId,
                isActive: true,
              }),
            );

            return {
              success: true,
              message: "User created successfully",
              user: newUser,
            };
          });

          // 6. Execute with rollback on failure
          return yield* createUserInRepo.pipe(
            Effect.catchAll((repoError) =>
              Effect.gen(function*() {
                // Rollback: Delete user from Supabase Auth if repo creation failed
                yield* Effect.promise(
                  () => supabase.adminClient.auth.admin.deleteUser(supabaseUserId),
                ).pipe(
                  Effect.catchAll(() =>
                    Effect.logError(
                      `Failed to rollback Supabase Auth user ${supabaseUserId}`,
                    )
                  ),
                );

                // Re-throw the original repo error
                return yield* Effect.fail(repoError);
              })
            ),
          );
        }).pipe(
          sql.withTransaction, // Wrap in transaction for consistency
          Effect.withSpan("Users.create", {
            attributes: { accountId, email: data.email },
          }),
        );

      /**
       * Update existing user with validation and transaction safety
       *
       * Transaction boundaries:
       * 1. Find existing user (with authorization check)
       * 2. Validate update data
       * 3. Apply updates with proper auditing
       * All in single transaction
       */
      const update = (
        accountId: AccountId,
        id: UserId,
        data: typeof UserJsonUpdate.Type,
      ) =>
        Effect.gen(function*() {
          // 1. Find existing user and verify it belongs to current account
          const existingUserOption = yield* usersRepo.findById(id);

          if (existingUserOption._tag === "None") {
            return yield* Effect.fail(new UserNotFound({ id }));
          }

          const existingUser = existingUserOption.value;

          // Security: Verify user belongs to current account (multi-tenant isolation)
          if (existingUser.accountId !== accountId) {
            return yield* Effect.fail(new UserNotFound({ id }));
          }

          // 2. If email is being updated, check for duplicates
          if (data.email && data.email !== existingUser.email) {
            const duplicateOption = yield* usersRepo.findByEmail(
              accountId,
              data.email,
            );

            if (duplicateOption._tag === "Some" && duplicateOption.value.id !== id) {
              return yield* Effect.fail(
                new UserEmailExists({
                  email: data.email,
                  accountId: accountId,
                }),
              );
            }
          }

          // 3. Apply updates
          const updatedUser = yield* usersRepo.update({
            ...existingUser,
            ...data,
            id, // Ensure ID cannot be changed
            accountId: existingUser.accountId, // Ensure account cannot be changed
            updatedAt: Model.Override(existingUser.updatedAt), // Let the system update timestamp
          });

          return {
            success: true,
            message: "User updated successfully",
            user: updatedUser,
          };
        }).pipe(
          sql.withTransaction, // Transaction for consistency
          Effect.withSpan("Users.update", {
            attributes: { accountId, id, updates: data },
          }),
        );

      /**
       * Find user by email within account
       * Used for login and duplicate checking
       */
      const findByEmail = (accountId: AccountId, email: Email) =>
        pipe(
          usersRepo.findByEmail(accountId, email),
          Effect.flatMap(
            Option.match({
              onNone: () => Effect.fail(new UserNotFound({ id: `email:${email}` })),
              onSome: (user) =>
                user.isActive
                  ? Effect.succeed(user)
                  : Effect.fail(new UserNotFound({ id: `email:${email}` })),
            }),
          ),
          Effect.withSpan("Users.findByEmail", { attributes: { accountId, email } }),
        );

      // ========================================================================
      // Service Interface
      // ========================================================================

      return {
        // Core operations
        findById,
        getCurrentUser,
        listByAccount,

        // Management operations
        create,
        update,
        findByEmail,
      } as const;
    }),
  },
) {}

export const UsersServiceLive = UsersService.Default;
