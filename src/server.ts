import * as http from 'http';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Client } from 'pg';

import { AppModule } from './app.module';
import { buildCorsHeaders, buildCorsOptions } from './config/cors.config';
import { AppDataSource } from './config/database.config';

const logger = new Logger('ServerBootstrap');
const port = Number(process.env.PORT) || 8080;
const SCHEMA_MIGRATION_LOCK_KEY = 1741377600;

let nestApp: INestApplication | null = null;
let nestReady = false;
let bootstrapError: string | null = null;
let bootstrapAttempts = 0;
let bootstrapInFlight = false;
let bootstrapRetryTimer: NodeJS.Timeout | null = null;

const BOOTSTRAP_RETRY_INITIAL_DELAY_MS = Number(
  process.env.BOOTSTRAP_RETRY_INITIAL_DELAY_MS || 3000,
);
const BOOTSTRAP_RETRY_MAX_DELAY_MS = Number(
  process.env.BOOTSTRAP_RETRY_MAX_DELAY_MS || 15000,
);

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
        bootstrapError,
        bootstrapAttempts,
        dbTest: '/api/db-test',
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  if (url.pathname === '/db-test' || url.pathname === '/api/db-test') {
    const result = await runDatabaseProbe();
    res.writeHead(result.success ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  if (!nestReady || !nestApp) {
    const failedToBootstrap = Boolean(bootstrapError);
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        statusCode: 503,
        message: failedToBootstrap
          ? 'Application startup failed'
          : 'Application is still initializing',
        error: 'Service Unavailable',
        details: {
          bootstrapError,
          bootstrapAttempts,
          health: '/api/health',
          dbTest: '/api/db-test',
        },
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
  if (bootstrapInFlight || nestReady) {
    return;
  }

  try {
    bootstrapInFlight = true;
    bootstrapAttempts += 1;
    logger.log('Bootstrapping Nest application in background');
    bootstrapError = null;

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
    await runRuntimeMigrationsIfEnabled();

    nestApp = app;
    nestReady = true;
    bootstrapAttempts = 0;
    clearBootstrapRetryTimer();
    logger.log('Nest application initialized successfully');
  } catch (error) {
    nestReady = false;
    bootstrapError = getErrorMessage(error);
    logger.error('Nest background bootstrap failed', error as Error);
    scheduleBootstrapRetry();
  } finally {
    bootstrapInFlight = false;
  }
}

function scheduleBootstrapRetry(): void {
  if (bootstrapRetryTimer || nestReady) {
    return;
  }

  const retryDelay = Math.min(
    BOOTSTRAP_RETRY_INITIAL_DELAY_MS * Math.max(bootstrapAttempts, 1),
    BOOTSTRAP_RETRY_MAX_DELAY_MS,
  );

  logger.warn(`Scheduling bootstrap retry in ${retryDelay}ms`);
  bootstrapRetryTimer = setTimeout(() => {
    bootstrapRetryTimer = null;
    void bootstrapNestApp();
  }, retryDelay);
}

function clearBootstrapRetryTimer(): void {
  if (!bootstrapRetryTimer) {
    return;
  }

  clearTimeout(bootstrapRetryTimer);
  bootstrapRetryTimer = null;
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
  clearBootstrapRetryTimer();
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

async function runRuntimeMigrationsIfEnabled(): Promise<void> {
  if (process.env.DB_MIGRATIONS !== 'true') {
    return;
  }

  const shouldDestroy = !AppDataSource.isInitialized;

  try {
    if (shouldDestroy) {
      await AppDataSource.initialize();
    }

    logger.log('Running runtime migrations');
    await AppDataSource.query('SELECT pg_advisory_lock($1)', [SCHEMA_MIGRATION_LOCK_KEY]);

    try {
      const executed = await AppDataSource.runMigrations();
      logger.log(`Runtime migrations complete (${executed.length} executed)`);
    } finally {
      await AppDataSource.query('SELECT pg_advisory_unlock($1)', [SCHEMA_MIGRATION_LOCK_KEY]);
    }
  } finally {
    if (shouldDestroy && AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

async function runDatabaseProbe() {
  const startTime = Date.now();
  const host = process.env.DATABASE_HOST;
  const database = process.env.DATABASE_NAME;
  const isUnixSocket = host?.startsWith('/');

  const client = new Client({
    host: isUnixSocket ? host : undefined,
    port: isUnixSocket ? undefined : Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database,
    connectionTimeoutMillis: 2000,
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW() as now');
    await client.end();

    return {
      success: true,
      duration: Date.now() - startTime,
      connection: {
        host: isUnixSocket ? host : `${host}:${process.env.DATABASE_PORT || 5432}`,
        database,
      },
      result: result.rows[0],
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      connection: {
        host: isUnixSocket ? host : `${host}:${process.env.DATABASE_PORT || 5432}`,
        database,
      },
      error: getErrorMessage(error),
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
