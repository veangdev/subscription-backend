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
          useFactory: (config: ConfigService) => {
            // CRITICAL: Return config immediately without awaiting anything
            const dbConfig = databaseConfigFactory(config);
            console.log('[LazyDatabase] Configuring with lazy connection pool...');
            return {
              ...dbConfig,
              autoLoadEntities: true,
              synchronize: false,
              migrationsRun: false,
              logging: ['error'],
              // CRITICAL: Connection happens on first query, not during init
              extra: {
                ...dbConfig.extra,
                connectionTimeoutMillis: 1000,
                min: 0, // No connections created on startup
                max: 10,
                idleTimeoutMillis: 30000,
              },
            };
          },
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
  
  async onModuleInit() {
    // Database connection pool created but no connections established yet
    console.log('[LazyDatabaseModule] Module initialized - database will connect on first query');
    LazyDatabaseModule.dbReady = true;
  }
  
  static isDatabaseReady(): boolean {
    return LazyDatabaseModule.dbReady;
  }
}
