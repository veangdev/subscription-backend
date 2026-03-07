import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshDto } from './dto/admin-refresh.dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminAccessGuard } from '../access-control/guards/admin-access.guard';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Admin login with username + password' })
  @ApiOkResponse({ description: 'JWT returned' })
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh admin access token' })
  @ApiOkResponse({ description: 'Fresh access token returned' })
  refresh(@Body() dto: AdminRefreshDto) {
    return this.adminAuthService.refresh(dto);
  }

  @UseGuards(AdminAccessGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated admin user' })
  @ApiOkResponse({ description: 'Current admin user info' })
  getMe(@CurrentUser() user: { id: string }) {
    return this.adminAuthService.getCurrentAdmin(user.id);
  }

  @Public()
  @Post('seed-default-admin')
  @ApiOperation({ summary: 'Seed default admin user (username: admin, password: Admin@123)' })
  @ApiOkResponse({ description: 'Default admin user created or already exists' })
  seedDefaultAdmin() {
    return this.adminAuthService.seedDefaultAdmin();
  }
}
