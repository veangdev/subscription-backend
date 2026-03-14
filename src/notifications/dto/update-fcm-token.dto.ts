import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFcmTokenDto {
  @ApiProperty({
    description: 'Firebase Cloud Messaging token',
    example: 'dGh3Si4...xyz',
  })
  @IsString()
  @IsNotEmpty()
  fcm_token: string;
}
