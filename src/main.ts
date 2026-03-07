// src/main.ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

const API_PREFIX = 'api';
const DEFAULT_PORT = 8080;

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  logger.log(`Bootstrapping application in ${process.env.NODE_ENV || 'development'} mode`);
  logger.log(`Database host: ${process.env.DATABASE_HOST}`);
  logger.log(`Database name: ${process.env.DATABASE_NAME}`);
  logger.log(`Database user: ${process.env.DATABASE_USER}`);
  logger.log(`PORT: ${process.env.PORT || DEFAULT_PORT}`);
  logger.log(`DB_RETRY_ATTEMPTS: ${process.env.DB_RETRY_ATTEMPTS}`);
  logger.log(`DB_CONNECTION_TIMEOUT_MS: ${process.env.DB_CONNECTION_TIMEOUT_MS}`);
  
  logger.log('Creating Nest application (non-blocking)...');
  const app = await NestFactory.create(AppModule, {
    abortOnError: false, // CRITICAL: Don't abort if database fails
    logger: ['error', 'warn', 'log'],
    bufferLogs: false,
  });
  logger.log('✓ Nest application created - HTTP server will start immediately');

  app.setGlobalPrefix(API_PREFIX);

  configureCors(app);
  configureValidation(app);
  configureSwagger(app);
  logger.log('Application configuration complete');

  const port = Number(process.env.PORT) || DEFAULT_PORT;
  logger.log(`Binding HTTP server to 0.0.0.0:${port}`);
  await app.listen(port, '0.0.0.0');

  logger.log(`✓ Application is running on port ${port}`);
  logger.log(`✓ API Documentation available at /${API_PREFIX}/docs`);
}

function configureCors(app: INestApplication): void {
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });
}

function configureValidation(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

function configureSwagger(app: INestApplication): void {
  const swaggerEnabled =
    process.env.SWAGGER_ENABLED === 'true' ||
    process.env.NODE_ENV !== 'production';

  if (!swaggerEnabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Subscription Box API')
    .setDescription('API for Subscription Box Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, document);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error);
  process.exit(1);
});
