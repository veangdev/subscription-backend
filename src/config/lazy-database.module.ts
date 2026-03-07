// Lazy-loading TypeORM module that doesn't block app startup
import { Module, DynamicModule, Global, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { databaseConfigFactory } from './database.config';

@Global()
@Module({})
export class LazyDatabaseModule implements OnModuleInit {
  private static dbReady = false;
  
  static forRootAsync(): DynamicModule {
    return {
      module: LazyDatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => {
            const dbConfig = databaseConfigFactory(config);
            return {
              ...dbConfig,
              autoLoadEntities: true,
              synchronize: false,
              migrationsRun: false,
              logging: false,
              // CRITICAL: Make connection pool lazy
              extra: {
                ...dbConfig.extra,
                // Don't create connections on startup
                connectionTimeoutMillis: 500,
                // Allow zero connections initially
                min: 0,
              },
            };
          },
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
  
  async onModuleInit() {
    // Database connection happens here, AFTER HTTP server is listening
    console.log('[LazyDatabaseModule] Module initialized - database pool ready for connections');
    LazyDatabaseModule.dbReady = true;
  }
  
  static isDatabaseReady(): boolean {
    return LazyDatabaseModule.dbReady;
  }
}
