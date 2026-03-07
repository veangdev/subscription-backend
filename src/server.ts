import * as http from 'http';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { buildCorsHeaders, buildCorsOptions } from './config/cors.config';

const logger = new Logger('ServerBootstrap');
const port = Number(process.env.PORT) || 8080;

let nestApp: INestApplication | null = null;
let nestReady = false;

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  applyCorsHeaders(origin, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/health' || url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: nestReady ? 'ok' : 'starting',
        environment: process.env.NODE_ENV || 'development',
        nestReady,
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  if (!nestReady || !nestApp) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        statusCode: 503,
        message: 'Application is still initializing',
        error: 'Service Unavailable',
      }),
    );
    return;
  }

  const handler = nestApp.getHttpAdapter().getInstance();
  handler(req, res);
});

server.listen(port, '0.0.0.0', () => {
  logger.log(`HTTP front server listening on 0.0.0.0:${port}`);
  void bootstrapNestApp();
});

async function bootstrapNestApp(): Promise<void> {
  try {
    logger.log('Bootstrapping Nest application in background');

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'],
      abortOnError: false,
    });

    app.setGlobalPrefix('api');
    app.enableCors(buildCorsOptions());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    const swaggerEnabled =
      process.env.SWAGGER_ENABLED === 'true' ||
      process.env.NODE_ENV !== 'production';

    if (swaggerEnabled) {
      const config = new DocumentBuilder()
        .setTitle('Subscription Box API')
        .setDescription('API for Subscription Box Management System')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
    }

    await app.init();

    nestApp = app;
    nestReady = true;
    logger.log('Nest application initialized successfully');
  } catch (error) {
    nestReady = false;
    logger.error('Nest background bootstrap failed', error as Error);
  }
}

function applyCorsHeaders(
  origin: string | string[] | undefined,
  res: http.ServerResponse,
): void {
  const normalizedOrigin = Array.isArray(origin) ? origin[0] : origin;
  const headers = buildCorsHeaders(normalizedOrigin);

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}

function shutdown(signal: string): void {
  logger.log(`Received ${signal}, shutting down`);
  server.close(() => {
    if (!nestApp) {
      process.exit(0);
      return;
    }

    nestApp
      .close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
