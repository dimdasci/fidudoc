#!/bin/bash

# Test validation error handling
# This script tests that missing required fields return proper 400 error

set -e

# Test data
ACCOUNT_ID="019a261c-e755-708f-8240-ab4ec58e594e"
TEST_EMAIL="test-user-$(date +%s)@example.com"

# Get auth token for admin@fidudoc.eu
AUTH_TOKEN=$(pnpm auth admin@fidudoc.eu -h 2>/dev/null | tail -1 | cut -d' ' -f3)

if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  echo "Make sure:"
  echo "  1. You have users.json configured with admin@fidudoc.eu"
  echo "  2. Environment variables are set (.env file)"
  exit 1
fi


echo "🧪 Testing validation error (missing required fields)..."
echo "  Account: $ACCOUNT_ID (Fidudoc)"
echo "  Email: $TEST_EMAIL (only)"
echo ""

# Create user WITHOUT required fields (should fail with 400)
echo "→ Sending request with only email (missing displayName, fullName, isActive)..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"email\":\"$TEST_EMAIL\"}" \
  "http://localhost:3000/accounts/$ACCOUNT_ID/users" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "✅ Test completed"
