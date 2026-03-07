-- Update the existing user to be admin with username
-- Run this in Google Cloud Console > SQL > subscription-db > Query Editor

-- Check if user exists
SELECT id, name, email, username, role 
FROM "user" 
WHERE email = 'admin@boxadmin.com';

-- Update to admin with username
UPDATE "user"
SET 
    username = 'admin',
    role = 'Admin'
WHERE email = 'admin@boxadmin.com';

-- Verify the update
SELECT id, name, username, email, role 
FROM "user" 
WHERE email = 'admin@boxadmin.com';
