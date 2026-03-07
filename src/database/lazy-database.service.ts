// src/database/lazy-database.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfigFactory } from '../config/database.config';

@Injectable()
export class LazyDatabaseService implements OnModuleInit {
  private readonly logger = new Logger(LazyDatabaseService.name);
  private dataSource: DataSource | null = null;
  private initializationPromise: Promise<void> | null = null;
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize database connection AFTER HTTP server starts
   * This is called by NestJS lifecycle hook but doesn't block startup
   */
  async onModuleInit() {
    this.logger.log('⏳ Database initialization scheduled (non-blocking)...');
    
    // Start initialization in background - don't await!
    this.initializationPromise = this.initializeDatabase();
    
    // DON'T await - let it happen in background
    this.initializationPromise.catch((error) => {
      this.logger.error('❌ Database initialization failed (non-blocking):', error.message);
      // Don't throw - app can still serve health checks
    });
    
    this.logger.log('✅ HTTP server continues startup - DB connecting in background');
  }

  private async initializeDatabase(): Promise<void> {
    try {
      this.logger.log('Attempting database connection...');
      
      const dbConfig = databaseConfigFactory(this.configService) as DataSourceOptions;
      this.dataSource = new DataSource(dbConfig);
      
      await this.dataSource.initialize();
      
      this.isInitialized = true;
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('Database connection failed:', error.message);
      this.logger.warn('⚠️  Application will continue without database');
      throw error;
    }
  }

  /**
   * Wait for database to be ready (for endpoints that need DB)
   */
  async waitForDatabase(timeoutMs = 30000): Promise<DataSource> {
    if (this.isInitialized && this.dataSource) {
      return this.dataSource;
    }

    if (!this.initializationPromise) {
      throw new Error('Database initialization not started');
    }

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout')), timeoutMs);
    });

    await Promise.race([this.initializationPromise, timeoutPromise]);

    if (!this.dataSource) {
      throw new Error('Database not initialized');
    }

    return this.dataSource;
  }

  /**
   * Check if database is ready (non-throwing)
   */
  isDatabaseReady(): boolean {
    return this.isInitialized && this.dataSource !== null;
  }

  getDataSource(): DataSource | null {
    return this.dataSource;
  }
}
