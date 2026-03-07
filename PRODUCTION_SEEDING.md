# Seed Production Database from Local Machine

This guide explains how to seed your production Cloud SQL database from your local development machine.

## Quick Start

Run this command to automatically seed production database:

```bash
npm run seed:admin
```

But first, you need to set up Cloud SQL Proxy (one-time setup below).

---

## One-Time Setup

### 1. Install Cloud SQL Proxy

**macOS:**
```bash
brew install cloud-sql-proxy
```

**Linux:**
```bash
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud-sql-proxy
chmod +x cloud-sql-proxy
sudo mv cloud-sql-proxy /usr/local/bin/
```

### 2. Update Production Environment File

Edit `.env.production` and replace placeholders:

```bash
# Update YOUR_PROJECT_ID to your actual Google Cloud project ID
# Update 'your_production_password_here' with the actual database password

DATABASE_PASSWORD=<GET_FROM_GOOGLE_CLOUD_SECRET_MANAGER>
```

To get the password:
1. Go to Google Cloud Console → Secret Manager
2. Find `database-password` secret
3. Copy the secret value

### 3. Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

---

## Running the Seeder

### Step 1: Start Cloud SQL Proxy

In a terminal window, run:

```bash
cloud-sql-proxy YOUR_PROJECT_ID:us-central1:subscription-db
```

**Example:**
```bash
cloud-sql-proxy my-project-123:us-central1:subscription-db
```

Leave this running in the background.

### Step 2: Seed the Database

In a **new terminal**, run:

```bash
cd subscription-backend
npm run seed:admin
```

You should see:
```
✅ Admin user created successfully
   Username: admin
   Password: Admin@123
   Email: admin@boxadmin.com
```

---

## What Gets Created

The seeder creates a system administrator account:

- **Username**: `admin`
- **Password**: `Admin@123`
- **Email**: `admin@boxadmin.com`
- **Role**: `Admin`

You can use these credentials to login at the BoxAdmin panel.

---

## Troubleshooting

### Error: "connection refused"
- Make sure Cloud SQL Proxy is running
- Check that `.env.production` has correct database password

### Error: "Admin user already exists"
- This is normal! The admin has already been created.
- The seeder is safe to run multiple times.

### Error: "ts-node command not found"
Run: `npm install`

### Error: "permission denied"  
Make sure you're authenticated:
```bash
gcloud auth login
gcloud auth application-default login
```

---

## Alternative: Manual SQL

If you prefer not to use Cloud SQL Proxy, run this SQL directly in Google Cloud Console:

1. Go to Cloud Console → SQL → subscription-db
2. Open Query Editor
3. Run the SQL from `/src/database/seeders/admin-user.sql`

---

## Security Note

⚠️ **IMPORTANT**: Change the default password (`Admin@123`) after first login in production!
