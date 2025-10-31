#!/bin/bash

# Quick test for creating a user
# This script tests ONLY the create user endpoint (NO AUTHENTICATION)

set -e

# Test data
ACCOUNT_ID="019a261c-e755-708f-8240-ab4ec58e594e"
TEST_EMAIL="test-user-$(date +%s)@example.com"

echo "🧪 Creating new user (without authentication)..."
echo "  Account: $ACCOUNT_ID (Fidudoc)"
echo "  Email: $TEST_EMAIL"
echo ""

# Create user WITHOUT authentication (with all required fields)
curl -X POST \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"displayName\":\"Test User\",\"fullName\":\"Test User Full\",\"isActive\":true}" \
  "http://localhost:3000/accounts/$ACCOUNT_ID/users" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "✅ Test completed"
