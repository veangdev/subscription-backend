import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';

class Main {
  private readonly logger = new Logger(Main.name);
  private app: INestApplication;

  async run(): Promise<this> {
    // Create NestJS application
    this.app = await NestFactory.create(AppModule);

    // Enable CORS for mobile app
    this.app.enableCors({
      origin: '*', // In production, specify your mobile app's origin
      credentials: true,
    });

    // Global validation pipe
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // API prefix
    this.app.setGlobalPrefix('api');

    // Swagger API documentation
    this.setupSwagger();

    return this;
  }

  private setupSwagger(): void {
    const config = new DocumentBuilder()
      .setTitle('Subscription Box API')
      .setDescription('API for Subscription Box Management System')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(this.app, config);
    SwaggerModule.setup('api/docs', this.app, document);
  }

  async start(): Promise<void> {
    try {
      const port = process.env.PORT || 8080;
      await this.app.listen(port);

      this.logger.log(`
  🚀 Application is running on: http://localhost:${port}
  📚 API Documentation: http://localhost:${port}/api/docs
      `);
    } catch (error) {
      this.logger.error('Failed to start server', error);
      process.exit(1);
    }
  }
}

const main = new Main();
void main.run().then(() => main.start());
