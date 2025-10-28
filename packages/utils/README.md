# Fidudoc CLI Utils

A collection of CLI utilities for user management and application testing in the Fidudoc system.

## Features

- **User Authentication**: Authenticate users via Supabase and retrieve access tokens
- **User Metadata Management**: Add account IDs to user metadata

## Prerequisites

1. **Environment Variables**: Set up your Supabase credentials in a `.env` file in the project root:
   ```bash
   # Copy .env.template to .env and fill in your values
   cp .env.template .env

   # Or set up manually:
   echo "SUPABASE_URL=your-supabase-url" >> .env
   echo "SUPABASE_PUBLIC_KEY=your-supabase-public-key" >> .env
   ```

   The CLI utilities automatically load environment variables using `dotenv-cli`.

2. **User Credentials File**: Create a `users.json` file in the project root with user credentials:
   ```json
   {
     "users": [
       {
         "email": "admin@example.com",
         "password": "your-password-here"
       },
       {
         "email": "user@example.com",
         "password": "your-password-here"
       }
     ]
   }
   ```

   A template file `users.json.template` is provided for reference.

## Installation

The utilities are included in the monorepo workspace. Install dependencies:

```bash
pnpm install
```

## Usage

### 1. User Authentication

Authenticate a user and retrieve their access token:

```bash
# From project root
pnpm auth <email> [options]

# Get raw access token
pnpm auth admin@example.com

# Get formatted Authorization header for HTTP requests
pnpm auth admin@example.com -h
pnpm auth admin@example.com --header
```

**Standard Output:**

```
🔐 Authenticating user: admin@example.com
✅ Authentication successful
🎟️  Access Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Header Output (-h/--header):**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

This clean output is perfect for automation scripts and can be used directly with curl or other HTTP tools.

**Automation Example:**

```bash
# Extract clean header for use in scripts (environment loaded automatically)
AUTH_HEADER=$(pnpm auth user@example.com -h 2>/dev/null | tail -1)

# Use in curl
curl -H "$AUTH_HEADER" http://localhost:3000/api/users

# Use in HTTP files or other tools
echo "$AUTH_HEADER"

# For CI/CD or scripts without pnpm workspace
cd packages/utils
AUTH_HEADER=$(dotenv -e ../../.env -- tsx src/auth.ts user@example.com -h)
```

### 2. User Metadata Update

Add an account ID to a user's metadata:

```bash
# From project root
pnpm user-metadata <email> <accountId>

# Example
pnpm user-metadata admin@example.com acc-123456
```

**Output:**

```
👤 Adding accountId "acc-123456" to user: admin@example.com
🔐 Authenticating user: admin@example.com
✅ Authentication successful
🔄 Updating user metadata...
✅ User metadata updated successfully
📋 User ID: 550e8400-e29b-41d4-a716-446655440000
📧 Email: admin@example.com
🏢 Account ID: acc-123456
```

## Development

### Run Utilities Directly

You can also run the utilities directly from the utils package:

```bash
cd packages/utils

# Install dependencies
pnpm install

# Run authentication
pnpm auth admin@example.com

# Run user metadata update
pnpm user-metadata admin@example.com acc-123456
```

### Project Structure

```
packages/utils/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Package exports
│   ├── auth.ts           # Authentication utility
│   └── user-metadata.ts  # User metadata management
└── README.md
```

## API Reference

### Authentication (`auth.ts`)

#### `authenticateUser(email: string): Promise<string>`

Authenticates a user and returns their access token.

- **Parameters:**
  - `email`: User's email address
- **Returns:** Promise resolving to the access token
- **Throws:** Process exit on authentication failure

#### `loadUserCredentials(): UsersData`

Loads user credentials from `users.json` file.

- **Returns:** Object containing array of user credentials
- **Throws:** Process exit if file not found or invalid format

#### `getSupabaseClient()`

Creates and returns a configured Supabase client.

- **Returns:** Supabase client instance
- **Throws:** Process exit if environment variables missing

### User Metadata (`user-metadata.ts`)

#### `updateUserMetadata(email: string, accountId: string): Promise<void>`

Updates a user's metadata with the provided account ID.

- **Parameters:**
  - `email`: User's email address
  - `accountId`: Account ID to add to user metadata
- **Returns:** Promise resolving when update complete
- **Throws:** Process exit on failure

## Error Handling

The utilities provide comprehensive error handling with descriptive messages:

- **Missing environment variables**: Clear instructions on required variables
- **Missing users.json**: Template format provided
- **Authentication failures**: Supabase error messages displayed
- **User not found**: Clear indication of missing user in credentials file

## Security Notes

1. **Credentials Storage**: The `users.json` file contains sensitive information. Ensure it's added to `.gitignore` and not committed to version control.

2. **Environment Variables**: Store Supabase credentials securely and never commit them to the repository.

3. **Access Tokens**: The returned access tokens are sensitive. Handle them securely and don't log them in production environments.

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure `SUPABASE_URL` and `SUPABASE_PUBLIC_KEY` are set
   - Check that variables are exported in your shell session

2. **"User not found in users.json"**
   - Verify the email exists in your `users.json` file
   - Check for typos in the email address

3. **"Authentication failed"**
   - Verify the password in `users.json` is correct
   - Ensure the user exists in your Supabase project
   - Check Supabase project settings and authentication configuration

4. **Module not found errors**
   - Run `pnpm install` in the project root
   - Ensure you're running commands from the project root directory
