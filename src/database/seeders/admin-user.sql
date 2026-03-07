-- Insert default admin user for Box Admin panel
-- Password: Admin@123 (bcrypt hashed with salt rounds 10)
-- Username: admin

INSERT INTO "user" (
  username,
  name,
  email,
  password,
  role,
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  'admin',
  'System Administrator',
  'admin@box.com',
  '$2b$10$rKJ7yH0pYQZ5X4K5X4K5XeuGX5X4K5X4K5X4K5X4K5X4K5X4K5X4Ke',
  'Admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (username) DO UPDATE SET
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  "isActive" = true,
  "updatedAt" = NOW();

-- Note: The password hash above is a placeholder. 
-- You need to generate the actual bcrypt hash for "Admin@123"
