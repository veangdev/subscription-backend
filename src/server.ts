// Fast health server that starts immediately on port 8080
// Then bootstraps NestJS with database in background
import * as http from 'http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

let nestApp: any = null;
let nestReady = false;

// Simple health server - responds immediately
const healthServer = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  
  // Health check - always responds quickly
  if (url.pathname === '/health' || url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: nestReady ? 'ok' : 'starting',
      environment: process.env.NODE_ENV || 'development',
      nestReady,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // If NestJS is ready, let it handle the request
  if (nestReady && nestApp) {
    // Forward to NestJS
    const nestHandler = nestApp.getHttpAdapter().getInstance();
    nestHandler(req, res);
  } else {
    // NestJS not ready yet
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'initializing',
      message: 'Application is starting, please try again in a moment',
    }));
  }
});

const PORT = Number(process.env.PORT) || 8080;

// Start health server IMMEDIATELY
healthServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Health server listening on 0.0.0.0:${PORT}`);
  console.log(`⏳ Bootstrapping NestJS in background...`);
  
  // Bootstrap NestJS in background
  bootstrapNestApp();
});

async function bootstrapNestApp() {
  try {
    console.log('Creating NestJS application...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    // Configure app
    app.setGlobalPrefix('api');
    app.enableCors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Swagger
    if (process.env.SWAGGER_ENABLED === 'true' || process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('Subscription Box API')
        .setDescription('API for Subscription Box Management System')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
    }

    // Initialize but don't listen (health server already listening)
    await app.init();
    
    nestApp = app;
    nestReady = true;
    
    console.log('✅ NestJS application fully initialized');
    console.log('✅ Database connected');
    console.log('✅ API Documentation available at /api/docs');
  } catch (error) {
    console.error('❌ Failed to bootstrap NestJS:', error);
    nestReady = false;
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  healthServer.close(() => {
    if (nestApp) {
      nestApp.close().then(() => process.exit(0));
    } else {
      process.exit(0);
    }
  });
});
