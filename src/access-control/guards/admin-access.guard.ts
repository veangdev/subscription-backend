import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AccessControlService } from '../access-control.service';

@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessControlService: AccessControlService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authUser = request.user as { id?: string } | undefined;

    if (!authUser?.id) {
      throw new UnauthorizedException('Authentication required');
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const access = await this.accessControlService.getUserAccessById(authUser.id, {
      allowLegacyAdminFallback: true,
    });

    if (access.user.status !== 'Active') {
      throw new ForbiddenException('Inactive accounts cannot access the admin workspace');
    }

    if (!access.is_admin) {
      throw new ForbiddenException('Admin access required');
    }

    const missingPermissions = requiredPermissions.filter(
      (permission) => !access.permissions.includes(permission),
    );

    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Missing required permission(s): ${missingPermissions.join(', ')}`,
      );
    }

    request.user = {
      ...request.user,
      ...access.user,
      permissions: access.permissions,
      is_admin: access.is_admin,
      role_details: access.role,
    };

    return true;
  }
}
