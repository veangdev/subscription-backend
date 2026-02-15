// src/main.ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

const API_PREFIX = 'api';
const DEFAULT_PORT = 8080;

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(API_PREFIX);

  configureCors(app);
  configureValidation(app);
  configureSwagger(app);

  const port = Number(process.env.PORT) || DEFAULT_PORT;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on port ${port}`);
  logger.log(`API Documentation available at /${API_PREFIX}/docs`);
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
