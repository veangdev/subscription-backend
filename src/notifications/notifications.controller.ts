import { Controller, Put, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Put('fcm-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user FCM token for push notifications',
  })
  async updateFcmToken(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateFcmTokenDto,
  ): Promise<{ success: boolean }> {
    await this.userRepository.update(user.id, {
      fcm_token: dto.fcm_token,
    });

    return { success: true };
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a test notification to current user',
  })
  async sendTestNotification(
    @CurrentUser() user: { id: string },
  ): Promise<{ success: boolean; message: string }> {
    const sent = await this.notificationsService.sendNotificationToUser(
      user.id,
      '🧪 Test Notification',
      'This is a test notification from your subscription app!',
      {
        type: 'test',
        timestamp: new Date().toISOString(),
      },
    );

    return {
      success: sent,
      message: sent
        ? 'Test notification sent successfully!'
        : 'Failed to send notification. Check if FCM token is registered.',
    };
  }
}
