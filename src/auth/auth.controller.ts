import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AuthService } from './auth.service';
import { AuthMeResponseDto } from './dto/auth-me-response.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User registered + JWT returned' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with phone number + password' })
  @ApiOkResponse({ description: 'JWT returned' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ description: 'Current user info', type: AuthMeResponseDto })
  getMe(@CurrentUser() user: { id: string; email: string }) {
    return this.authService.getCurrentUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiBearerAuth()
  @Post('me/profile-image')
  @ApiOperation({ summary: 'Upload or replace the current user profile image' })
  @ApiOkResponse({ description: 'Current user info with updated image', type: AuthMeResponseDto })
  uploadProfileImage(
    @CurrentUser() user: { id: string; email: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.authService.uploadProfileImage(user.id, file);
  }
}
