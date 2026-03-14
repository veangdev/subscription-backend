-- Quick fix: Add fcm_token column
-- Run this in Cloud SQL Query Editor: 
-- https://console.cloud.google.com/sql/instances/subscription-db/query?project=box-subscription-system

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fcm_token" text;

-- Verify it was added:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'fcm_token';
