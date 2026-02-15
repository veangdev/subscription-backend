import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: 'REVENUE', enum: ['REVENUE', 'CHURN', 'ACTIVE_SUBSCRIBERS'] })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ example: '{"total": 5000, "period": "monthly"}', required: false, description: 'Report data as JSON string' })
  @IsOptional()
  @IsString()
  data?: string;
}
