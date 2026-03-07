import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlService } from './access-control.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { User } from '../users/entities/user.entity';
import { RolesController } from './roles.controller';
import { PermissionsController } from './permissions.controller';
import { AdminAccessGuard } from './guards/admin-access.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Permission])],
  controllers: [RolesController, PermissionsController],
  providers: [AccessControlService, AdminAccessGuard],
  exports: [AccessControlService, AdminAccessGuard],
})
export class AccessControlModule {}
