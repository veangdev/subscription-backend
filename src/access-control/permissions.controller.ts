import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AccessControlService } from './access-control.service';
import { AdminAccessGuard } from './guards/admin-access.guard';
import { RequirePermissions } from './decorators/permissions.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(AdminAccessGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get('catalog')
  @RequirePermissions('security.roles.view')
  @ApiOperation({ summary: 'List the permission catalog grouped by section' })
  @ApiOkResponse({ description: 'Permission catalog returned successfully' })
  getCatalog() {
    return this.accessControlService.listPermissionsCatalog();
  }
}
