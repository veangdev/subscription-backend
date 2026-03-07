// src/main.ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { buildCorsOptions } from './config/cors.config';

const API_PREFIX = 'api';
const DEFAULT_PORT = 8080;

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  logger.log(`Bootstrapping application in ${process.env.NODE_ENV || 'development'} mode`);
  logger.log(`PORT: ${process.env.PORT || DEFAULT_PORT}`);
  
  logger.log('Creating Nest application...');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  logger.log('✓ Nest application created');

  app.setGlobalPrefix(API_PREFIX);

  configureCors(app);
  configureValidation(app);
  configureSwagger(app);
  logger.log('✓ Application configuration complete');

  const port = Number(process.env.PORT) || DEFAULT_PORT;
  logger.log(`🚀 Starting HTTP server on 0.0.0.0:${port}...`);
  await app.listen(port, '0.0.0.0');

  logger.log(`✅ HTTP SERVER LISTENING ON PORT ${port}`);
  logger.log(`✅ Health endpoint: http://0.0.0.0:${port}/api/health`);
  logger.log(`✅ API Documentation available at /${API_PREFIX}/docs`);
}

function configureCors(app: INestApplication): void {
  app.enableCors(buildCorsOptions());
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
