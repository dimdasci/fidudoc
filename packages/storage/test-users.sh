#!/bin/bash

# Test script for Users API endpoints
# This script authenticates and runs the API tests

set -e

echo "🔐 Authenticating user..."

# Get auth token for dmitry@fidudoc.eu
AUTH_TOKEN=$(pnpm auth dmitry@fidudoc.eu -h 2>/dev/null | tail -1 | cut -d' ' -f3)

if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  echo "Make sure:"
  echo "  1. You have users.json configured with dmitry@fidudoc.eu"
  echo "  2. Environment variables are set (.env file)"
  exit 1
fi

echo "✅ Authentication successful"
echo ""
echo "🧪 Running Users API tests..."
echo ""

# Run the test with the auth token
AUTH_TOKEN="$AUTH_TOKEN" node packages/storage/src/test-users-api.ts
