const { execSync } = require('child_process');

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Simple SQL migration - just add the column if it doesn't exist
    const { Client } = require('pg');
    
    const dbHost = process.env.DATABASE_HOST || 'localhost';
    const isUnixSocket = dbHost.startsWith('/');

    const clientConfig = {
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    };

    if (isUnixSocket) {
      // Cloud Run / Cloud SQL: connect via Unix domain socket
      clientConfig.host = dbHost;
    } else {
      clientConfig.host = dbHost;
      clientConfig.port = parseInt(process.env.DATABASE_PORT || '5432', 10);
    }

    const client = new Client(clientConfig);
    
    await client.connect();
    
    console.log('📊 Applying fcm_token column...');
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "fcm_token" text;');

    console.log('📦 Creating products table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(150) NOT NULL,
        "description" text,
        "category" character varying(100),
        "price" numeric(10,2) NOT NULL,
        "image_url" text,
        "sku" character varying(100),
        "weight_kg" numeric(8,3),
        "dimensions" character varying(50),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      );
    `);

    console.log('🔗 Creating subscription_plan_products join table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "subscription_plan_products" (
        "plan_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        CONSTRAINT "PK_subscription_plan_products" PRIMARY KEY ("plan_id", "product_id"),
        CONSTRAINT "FK_spp_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_spp_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    console.log('✅ Migrations complete!');
    await client.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
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
