const { execSync } = require('child_process');

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Simple SQL migration - just add the column if it doesn't exist
    const { Client } = require('pg');
    
    const client = new Client({
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT || 5432,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    });
    
    await client.connect();
    
    console.log('📊 Applying fcm_token column...');
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fcm_token" text;');
    
    console.log('✅ Migrations complete!');
    await client.end();
    
  } catch (error) {
    console.warn('⚠️  Migration warning:', error.message);
    console.log('Continuing with server startup...');
  }
}

async function startServer() {
  await runMigrations();
  
  console.log('🚀 Starting NestJS server...');
  require('./dist/server.js');
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
