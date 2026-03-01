import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Selected subscription plan ID',
  })
  @IsNotEmpty()
  @IsUUID()
  plan_id: string;
}
