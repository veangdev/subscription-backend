import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateUserStatusDto {
  @ApiProperty({ example: 'Inactive', enum: ['Active', 'Inactive'] })
  @IsIn(['Active', 'Inactive'])
  status: string;
}
