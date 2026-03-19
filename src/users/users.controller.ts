import {
  Controller,
  ForbiddenException,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  Header,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminAccessGuard } from '../access-control/guards/admin-access.guard';
import { RequirePermissions } from '../access-control/decorators/permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AdminAccessGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="users-export.csv"')
  @ApiOperation({ summary: 'Export users as CSV' })
  @ApiOkResponse({ description: 'Users exported successfully' })
  export(
    @Query() query: QueryUsersDto,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    this.assertAudiencePermission(request.user?.permissions, query.audience, 'export');
    return this.usersService.exportUsers(query);
  }

  @Post()
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created successfully' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ description: 'Paginated users returned successfully' })
  findAll(
    @Query() query: QueryUsersDto,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    this.assertAudiencePermission(request.user?.permissions, query.audience, 'view');
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'User found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    const user = await this.usersService.findOne(id);
    this.assertEntityPermission(request.user?.permissions, user.role, 'view');
    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'User updated' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    const existingUser = await this.usersService.findOne(id);
    this.assertTransitionPermission(request.user?.permissions, existingUser.role, dto.role, 'edit');
    return this.usersService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update a user status' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'User status updated' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() request: { user?: { permissions?: string[] } },
  ) {
    const existingUser = await this.usersService.findOne(id);
    this.assertEntityPermission(request.user?.permissions, existingUser.role, 'edit');
    return this.usersService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: { user?: { permissions?: string[] } },
  ): Promise<void> {
    const existingUser = await this.usersService.findOne(id);
    this.assertEntityPermission(request.user?.permissions, existingUser.role, 'delete');
    return this.usersService.remove(id);
  }

  private assertAudiencePermission(
    permissionKeys: string[] | undefined,
    audience: QueryUsersDto['audience'],
    action: 'view' | 'export',
  ) {
    const requiredPermission =
      audience === 'subscriber' ? `subscribers.${action}` : `users.${action}`;

    this.assertPermission(permissionKeys, requiredPermission);
  }

  private assertEntityPermission(
    permissionKeys: string[] | undefined,
    roleName: string,
    action: 'view' | 'edit' | 'delete',
  ) {
    const requiredPermission =
      roleName === 'Subscriber' ? `subscribers.${action}` : `users.${action}`;

    this.assertPermission(permissionKeys, requiredPermission);
  }

  private assertTransitionPermission(
    permissionKeys: string[] | undefined,
    currentRoleName: string,
    nextRoleName: string | undefined,
    action: 'edit',
  ) {
    const requiredPermissions = new Set<string>([
      currentRoleName === 'Subscriber' ? `subscribers.${action}` : `users.${action}`,
    ]);

    if (nextRoleName?.trim()) {
      requiredPermissions.add(
        nextRoleName.trim() === 'Subscriber' ? `subscribers.${action}` : `users.${action}`,
      );
    }

    for (const permissionKey of requiredPermissions) {
      this.assertPermission(permissionKeys, permissionKey);
    }
  }

  private assertPermission(permissionKeys: string[] | undefined, requiredPermission: string) {
    if (permissionKeys?.includes(requiredPermission)) {
      return;
    }

    throw new ForbiddenException(`Missing required permission(s): ${requiredPermission}`);
  }
}
