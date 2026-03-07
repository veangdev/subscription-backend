-- Upgrade user to admin with username
-- Run this in Google Cloud Console > SQL > subscription-db > Query Editor

UPDATE "user"
SET 
    username = 'admin',
    role = 'Admin'
WHERE email = 'admin@boxadmin.com';

-- Verify the update
SELECT id, name, username, email, role 
FROM "user" 
WHERE email = 'admin@boxadmin.com';
