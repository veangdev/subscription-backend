import { Controller, Put, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
}
