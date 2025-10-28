#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { authenticateUserSession } from "./auth";

async function updateUserMetadata(email: string, accountId: string): Promise<void> {
  console.log(`👤 Adding accountId "${accountId}" to user: ${email}`);

  // First authenticate the user to get a valid session
  const session = await authenticateUserSession(email);

  // Create a new Supabase client with the user's session
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePublicKey = process.env.SUPABASE_PUBLIC_KEY;

  if (!supabaseUrl || !supabasePublicKey) {
    console.error("❌ Missing Supabase environment variables");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabasePublicKey);

  // Set the session using the full session data
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  console.log("🔄 Updating user metadata...");

  const { data, error } = await supabase.auth.updateUser({
    data: { accountId },
  });

  if (error) {
    console.error("❌ Failed to update user metadata:", error.message);
    process.exit(1);
  }

  console.log("✅ User metadata updated successfully");
  console.log(`📋 User ID: ${data.user?.id}`);
  console.log(`📧 Email: ${data.user?.email}`);
  console.log(`🏢 Account ID: ${data.user?.user_metadata?.accountId}`);
}

async function main() {
  const email = process.argv[2];
  const accountId = process.argv[3];

  if (!email || !accountId) {
    console.error("❌ Usage: pnpm user-metadata <email> <accountId>");
    console.error("Example: pnpm user-metadata user@example.com acc-123456");
    process.exit(1);
  }

  try {
    await updateUserMetadata(email, accountId);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateUserMetadata };
