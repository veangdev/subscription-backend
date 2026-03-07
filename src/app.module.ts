import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { typeormDynamicProviders } from './config/typeorm-dynamic.provider';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AccessControlModule } from './access-control/access-control.module';
import { UsersModule } from './users/users.module';

// Import entities for TypeOrmModule.forFeature
import { User } from './users/entities/user.entity';
import { Role } from './access-control/entities/role.entity';
import { Permission } from './access-control/entities/permission.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // TypeORM with manual DataSource provider (non-blocking)
    TypeOrmModule.forFeature([User, Role, Permission]),
    ScheduleModule.forRoot(),
    // Enable auth modules for login
    AuthModule,
    AdminAuthModule,
    AccessControlModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ...typeormDynamicProviders, // Custom DataSource provider
  ],
  exports: [TypeOrmModule],
})
export class AppModule {}
