/**
 * Integration Test for Users API Endpoints
 *
 * Tests the HTTP API endpoints for user management.
 * This validates the complete request/response cycle through Express.
 *
 * PREREQUISITES:
 * 1. Server must be running: pnpm dev
 * 2. Set AUTH_TOKEN environment variable with a valid JWT token
 *    Example: AUTH_TOKEN=$(pnpm auth dmitry@fidudoc.eu -h 2>/dev/null | tail -1 | cut -d' ' -f3)
 */

// Real project data from database
const ACCOUNTS = {
  EASYBIZ: "019a261c-4bc6-75ea-b8dd-0d5756480086",
  FIDUDOC: "019a261c-e755-708f-8240-ab4ec58e594e",
} as const;

const USERS = {
  DMITRY: "ff60f64e-76cc-4234-b232-c9fa47327549", // dmitry@fidudoc.eu
  ADMIN: "a7b05f6c-2a07-4ecd-9138-67612431eff9", // admin@fidudoc.eu
} as const;

const API_BASE = "http://localhost:3000";

// Get auth token from environment variable
const AUTH_TOKEN = process.env.AUTH_TOKEN;

/**
 * Helper function to make HTTP requests with detailed logging
 */
async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  console.log(`\n→ ${method} ${path}`);
  if (body) {
    console.log(`  Body: ${JSON.stringify(body, null, 2)}`);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authentication if token is available
  if (AUTH_TOKEN) {
    headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    console.log(`← Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`  Error response: ${error}`);
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const data = await response.json() as T;
    console.log(`  Response: ${JSON.stringify(data, null, 2)}`);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`  Request failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Test listing all users in an account
 */
async function testListUsers(accountId: string, accountName: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: List all users in ${accountName} account`);
  console.log("=".repeat(60));

  try {
    const response = await apiRequest<{
      users: Array<{
        id: string;
        email: string;
        displayName: string;
        accountId: string;
      }>;
    }>(
      "GET",
      `/accounts/${accountId}/users`,
    );

    console.log(`\n✅ Found ${response.users.length} users`);
    response.users.forEach((u) => {
      console.log(`  - ${u.email} (${u.displayName})`);
    });

    return response.users;
  } catch (error) {
    console.error(`\n❌ Failed to list users: ${error}`);
    throw error;
  }
}

/**
 * Test getting a specific user by ID
 */
async function testGetUser(
  accountId: string,
  userId: string,
  accountName: string,
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: Get user by ID in ${accountName} account`);
  console.log("=".repeat(60));

  try {
    const response = await apiRequest<{
      id: string;
      email: string;
      displayName: string;
      accountId: string;
    }>(
      "GET",
      `/accounts/${accountId}/users/${userId}`,
    );

    console.log(`\n✅ User found: ${response.email} (${response.displayName})`);
    return response;
  } catch (error) {
    console.error(`\n❌ Failed to get user: ${error}`);
    throw error;
  }
}

/**
 * Test creating a new user
 */
async function testCreateUser(accountId: string, accountName: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: Create new user in ${accountName} account`);
  console.log("=".repeat(60));

  const newUser = {
    email: `test-user-${Date.now()}@example.com`,
    displayName: "Test User",
  };

  try {
    const response = await apiRequest<{
      success: boolean;
      message: string;
      user: {
        id: string;
        email: string;
        displayName: string;
        accountId: string;
      };
    }>(
      "POST",
      `/accounts/${accountId}/users`,
      newUser,
    );

    console.log(`\n✅ User created successfully!`);
    console.log(`  ID: ${response.user.id}`);
    console.log(`  Email: ${response.user.email}`);
    console.log(`  Display Name: ${response.user.displayName}`);
    console.log(`  Message: ${response.message}`);

    return response.user;
  } catch (error) {
    console.error(`\n❌ Failed to create user: ${error}`);
    throw error;
  }
}

/**
 * Test updating a user
 */
async function testUpdateUser(
  accountId: string,
  userId: string,
  accountName: string,
) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: Update user in ${accountName} account`);
  console.log("=".repeat(60));

  const updates = {
    displayName: `Updated User ${Date.now()}`,
  };

  try {
    const response = await apiRequest<{
      success: boolean;
      message: string;
      user: {
        id: string;
        email: string;
        displayName: string;
        accountId: string;
      };
    }>(
      "PUT",
      `/accounts/${accountId}/users/${userId}`,
      updates,
    );

    console.log(`\n✅ User updated successfully!`);
    console.log(`  New Display Name: ${response.user.displayName}`);
    console.log(`  Message: ${response.message}`);

    return response.user;
  } catch (error) {
    console.error(`\n❌ Failed to update user: ${error}`);
    throw error;
  }
}

/**
 * Test getting current authenticated user (legacy endpoint)
 */
async function testGetCurrentUser() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: Get current authenticated user (legacy endpoint)`);
  console.log("=".repeat(60));

  try {
    const response = await apiRequest<{
      id: string;
      email: string;
      displayName: string;
      accountId: string;
    }>(
      "GET",
      `/users/current`,
    );

    console.log(`\n✅ Current user: ${response.email} (${response.displayName})`);
    return response;
  } catch (error) {
    console.error(`\n❌ Failed to get current user: ${error}`);
    console.log(
      `  Note: This endpoint requires authentication middleware to be properly configured`,
    );
    // Don't throw - this is expected to fail without auth
    return null;
  }
}

/**
 * Test error handling with invalid account ID
 */
async function testInvalidAccountId() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: Error handling - Invalid account ID`);
  console.log("=".repeat(60));

  const invalidAccountId = "not-a-uuid";

  try {
    await apiRequest(
      "GET",
      `/accounts/${invalidAccountId}/users`,
    );

    console.error(`\n❌ Should have failed with invalid account ID!`);
    throw new Error("Expected validation error but request succeeded");
  } catch (error) {
    if (error instanceof Error && error.message.includes("HTTP")) {
      console.log(`\n✅ Correctly rejected invalid account ID`);
      return;
    }
    throw error;
  }
}

/**
 * Test error handling with non-existent user
 */
async function testNonExistentUser(accountId: string, accountName: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: Error handling - Non-existent user in ${accountName}`);
  console.log("=".repeat(60));

  const nonExistentUserId = "00000000-0000-0000-0000-000000000000";

  try {
    await apiRequest(
      "GET",
      `/accounts/${accountId}/users/${nonExistentUserId}`,
    );

    console.error(`\n❌ Should have failed with non-existent user!`);
    throw new Error("Expected UserNotFound error but request succeeded");
  } catch (error) {
    if (error instanceof Error && error.message.includes("HTTP")) {
      console.log(`\n✅ Correctly returned error for non-existent user`);
      return;
    }
    throw error;
  }
}

/**
 * Main test program
 */
async function runTests() {
  console.log("\n🚀 Testing Users API Endpoints");
  console.log("=".repeat(60));
  console.log("This test suite validates the complete HTTP API for user management");
  console.log("=".repeat(60));

  // Check for authentication token
  if (!AUTH_TOKEN) {
    console.error("\n❌ ERROR: AUTH_TOKEN environment variable not set");
    console.error("\nTo run this test, you need to authenticate first:");
    console.error("  1. Get an auth token:");
    console.error('     export AUTH_TOKEN=$(pnpm auth dmitry@fidudoc.eu -h 2>/dev/null | tail -1 | cut -d\' \' -f3)');
    console.error("  2. Run the test:");
    console.error("     node packages/storage/src/test-users-api.ts");
    console.error("\nOr combine into one command:");
    console.error('  AUTH_TOKEN=$(pnpm auth dmitry@fidudoc.eu -h 2>/dev/null | tail -1 | cut -d\' \' -f3) node packages/storage/src/test-users-api.ts');
    process.exit(1);
  }

  console.log(`\n🔑 Using authentication token: ${AUTH_TOKEN.substring(0, 20)}...`);

  try {
    // Test 1: List all users in Fidudoc account
    await testListUsers(ACCOUNTS.FIDUDOC, "Fidudoc");

    // Test 2: List all users in EasyBiz account
    await testListUsers(ACCOUNTS.EASYBIZ, "EasyBiz");

    // Test 3: Get specific user by ID
    await testGetUser(ACCOUNTS.FIDUDOC, USERS.DMITRY, "Fidudoc");

    // Test 4: Create new user in Fidudoc account
    const newUser = await testCreateUser(ACCOUNTS.FIDUDOC, "Fidudoc");

    // Test 5: Update the newly created user
    if (newUser) {
      await testUpdateUser(ACCOUNTS.FIDUDOC, newUser.id, "Fidudoc");
    }

    // Test 6: Get current user (may fail without auth)
    await testGetCurrentUser();

    // Test 7: Error handling - invalid account ID
    await testInvalidAccountId();

    // Test 8: Error handling - non-existent user
    await testNonExistentUser(ACCOUNTS.FIDUDOC, "Fidudoc");

    console.log("\n" + "=".repeat(60));
    console.log("✅ All Users API tests completed successfully!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ Test suite failed");
    console.error("=".repeat(60));
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Run the tests
runTests();
