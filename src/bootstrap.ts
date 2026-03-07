// Bootstrap NestJS and attach to existing HTTP server
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';
import { buildCorsOptions } from './config/cors.config';

const API_PREFIX = 'api';

export = async function bootstrap(httpServer: any) {
  console.log('[Bootstrap] Creating Express app...');
  const expressApp = express();
  
  console.log('[Bootstrap] Creating NestJS application...');
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      logger: ['error', 'warn', 'log'],
      abortOnError: false,
    },
  );

  app.setGlobalPrefix(API_PREFIX);
  app.enableCors(buildCorsOptions());
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
    SwaggerModule.setup(`${API_PREFIX}/docs`, app, document);
  }

  await app.init();
  console.log('[Bootstrap] ✅ NestJS initialized');

  // Replace the simple server handler with NestJS
  httpServer.removeAllListeners('request');
  httpServer.on('request', expressApp);
  
  console.log('[Bootstrap] ✅ NestJS attached to HTTP server');
  console.log(`[Bootstrap] ✅ API available at /${API_PREFIX}`);
  console.log(`[Bootstrap] ✅ Docs available at /${API_PREFIX}/docs`);
};
