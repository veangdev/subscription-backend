// Custom database provider that connects AFTER NestJS starts
import { Module, Global, OnApplicationBootstrap, Injectable } from '@nestjs/common';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { databaseConfigFactory } from './database.config';

@Injectable()
export class DatabaseConnectionService implements OnApplicationBootstrap {
  private dataSource: DataSource | null = null;
  private isConnected = false;
  private connectionError: Error | null = null;
  
  constructor(private configService: ConfigService) {}
  
  /**
   * This runs AFTER the HTTP server is listening
   * Database connection happens here, not during module initialization
   */
  async onApplicationBootstrap() {
    console.log('[DatabaseConnection] App fully bootstrapped - now connecting to database...');
    
    try {
      const config = databaseConfigFactory(this.configService) as DataSourceOptions;
      this.dataSource = new DataSource(config);
      
      // Try to connect with timeout
      const connectPromise = this.dataSource.initialize();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout after 5s')), 5000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      this.isConnected = true;
      console.log('[DatabaseConnection] ✅ Successfully connected to database');
    } catch (error) {
      this.connectionError = error as Error;
      console.error('[DatabaseConnection] ❌ Failed to connect:', error.message);
      console.log('[DatabaseConnection] App will continue running without database');
    }
  }
  
  getDataSource(): DataSource | null {
    return this.dataSource;
  }
  
  isReady(): boolean {
    return this.isConnected;
  }
  
  getError(): Error | null {
    return this.connectionError;
  }
}

@Global()
@Module({
  providers: [DatabaseConnectionService],
  exports: [DatabaseConnectionService],
})
export class PostStartupDatabaseModule {}
