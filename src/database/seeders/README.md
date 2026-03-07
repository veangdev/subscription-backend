# Admin User Seeder

## Overview

This seeder creates a default system administrator account for the BoxAdmin panel.

## Default Admin Credentials

```
Username: admin
Password: Admin@123
Email: admin@boxadmin.com
Role: Admin
```

## How to Run the Seeder

### Option 1: Using npm/yarn script

```bash
cd subscription-backend
npm run seed:admin
# or
yarn seed:admin
```

### Option 2: Using ts-node directly

```bash
cd subscription-backend
npx ts-node -r tsconfig-paths/register src/database/seeders/admin.seeder.ts
```

## What the Seeder Does

1. Connects to the database
2. Checks if a user with username `admin` already exists
3. If not, creates a new admin user with:
   - Name: System Administrator
   - Username: admin
   - Email: admin@boxadmin.com
   - Password: Admin@123 (bcrypt hashed)
   - Role: Admin
4. Prints success message with credentials

## After Running the Seeder

You can login to the BoxAdmin panel at `http://localhost:3001` using:
- Username: `admin`
- Password: `Admin@123`

## Security Notes

⚠️ **IMPORTANT**: Change the default password immediately after first login in production environments.

## Creating Additional Admin Users

You can modify the seeder to create additional admin users, or create them using the API:

```bash
curl -X POST https://subscription-backend-528466251837.us-central1.run.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Admin",
    "username": "newadmin",
    "email": "newadmin@boxadmin.com",
    "password": "SecurePassword123",
    "role": "Admin"
  }'
```

Then update the user's role to "Admin" in the database if needed.
