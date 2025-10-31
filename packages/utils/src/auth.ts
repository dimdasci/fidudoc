#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

interface UserCredential {
  email: string;
  password: string;
}

interface UsersData {
  users: UserCredential[];
}

function loadUserCredentials(): UsersData {
  try {
    // Try multiple locations for users.json
    const possiblePaths = [
      resolve(process.cwd(), "users.json"), // Current directory
      resolve(process.cwd(), "../../users.json"), // Project root when run from packages/utils
      resolve(process.cwd(), "../../../users.json"), // Project root when run from packages/utils/src
    ];

    let filePath: string | null = null;
    let fileContent: string | null = null;

    for (const path of possiblePaths) {
      try {
        fileContent = readFileSync(path, "utf-8");
        filePath = path;
        break;
      } catch {
        // Continue to next path
      }
    }

    if (!filePath || !fileContent) {
      throw new Error("users.json not found in any expected location");
    }

    return JSON.parse(fileContent);
  } catch (error) {
    console.error("❌ Error loading users.json:", error);
    console.error(
      "Make sure you have a users.json file in the project root with user credentials.",
    );
    console.error("Example format:");
    console.error(JSON.stringify(
      {
        users: [
          { email: "user@example.com", password: "password123" },
        ],
      },
      null,
      2,
    ));
    process.exit(1);
  }
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabasePublicKey = process.env.SUPABASE_PUBLIC_KEY;

  if (!supabaseUrl || !supabasePublicKey) {
    console.error("❌ Missing Supabase environment variables:");
    console.error("Required: SUPABASE_URL, SUPABASE_PUBLIC_KEY");
    process.exit(1);
  }

  return createClient(supabaseUrl, supabasePublicKey);
}

async function authenticateUser(email: string, silent = false): Promise<string> {
  const session = await authenticateUserSession(email, silent);
  return session.access_token;
}

async function authenticateUserSession(email: string, silent = false) {
  const usersData = loadUserCredentials();
  const userCredential = usersData.users.find(user => user.email === email);

  if (!userCredential) {
    console.error(`❌ User with email "${email}" not found in users.json`);
    process.exit(1);
  }

  const supabase = getSupabaseClient();

  if (!silent) {
    console.log(`🔐 Authenticating user: ${email}`);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: userCredential.email,
    password: userCredential.password,
  });

  if (error) {
    console.error("❌ Authentication failed:", error.message);
    process.exit(1);
  }

  if (!data.session) {
    console.error("❌ No session received");
    process.exit(1);
  }

  if (!silent) {
    console.log("✅ Authentication successful");
  }
  return data.session;
}

async function main() {
  const args = process.argv.slice(2);
  let email: string | undefined;
  let generateHeader = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-h" || arg === "--header") {
      generateHeader = true;
    } else if (!email && !arg.startsWith("-")) {
      email = arg;
    }
  }

  if (!email) {
    console.error("❌ Usage: pnpm auth <email> [options]");
    console.error("Options:");
    console.error(
      "  -h, --header    Output clean Authorization header (no other messages)",
    );
    console.error("");
    console.error("Examples:");
    console.error("  pnpm auth user@example.com");
    console.error("  pnpm auth user@example.com -h");
    console.error("");
    console.error("Automation:");
    console.error(
      "  AUTH_HEADER=$(pnpm auth user@example.com -h 2>/dev/null | tail -1)",
    );
    console.error("  curl -H \"$AUTH_HEADER\" http://localhost:3000/api");
    process.exit(1);
  }

  try {
    const accessToken = await authenticateUser(email, generateHeader);

    if (generateHeader) {
      // Output only the clean Authorization header for direct use
      console.log(`Authorization: Bearer ${accessToken}`);
    } else {
      console.log("🎟️  Access Token:");
      console.log(accessToken);
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  authenticateUser,
  authenticateUserSession,
  getSupabaseClient,
  loadUserCredentials,
};
