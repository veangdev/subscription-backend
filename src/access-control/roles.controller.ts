import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AccessControlService } from './access-control.service';
import { AdminAccessGuard } from './guards/admin-access.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRolePermissionsDto } from './dto/assign-role-permissions.dto';
import { RequirePermissions } from './decorators/permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(AdminAccessGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly accessControlService: AccessControlService) {}

  @Get()
  @RequirePermissions('security.roles.view')
  @ApiOperation({ summary: 'List all roles' })
  @ApiOkResponse({ description: 'Roles returned successfully' })
  findAll() {
    return this.accessControlService.listRoles();
  }

  @Get(':id')
  @RequirePermissions('security.roles.view')
  @ApiOperation({ summary: 'Get role details' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Role returned successfully' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.accessControlService.findRole(id);
  }

  @Post()
  @RequirePermissions('security.roles.manage')
  @ApiOperation({ summary: 'Create a role' })
  @ApiCreatedResponse({ description: 'Role created successfully' })
  create(@Body() dto: CreateRoleDto) {
    return this.accessControlService.createRole(dto);
  }

  @Patch(':id')
  @RequirePermissions('security.roles.manage')
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Role updated successfully' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.accessControlService.updateRole(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('security.roles.manage')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Role deleted successfully' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.accessControlService.removeRole(id);
  }

  @Get(':id/permissions')
  @RequirePermissions('security.roles.view')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Role permissions returned successfully' })
  findPermissions(@Param('id', ParseUUIDPipe) id: string) {
    return this.accessControlService.findRolePermissions(id);
  }

  @Post(':id/permissions')
  @RequirePermissions('security.permissions.assign')
  @ApiOperation({ summary: 'Replace permissions assigned to a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ description: 'Role permissions updated successfully' })
  replacePermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRolePermissionsDto,
  ) {
    return this.accessControlService.replaceRolePermissions(id, dto);
  }
}
