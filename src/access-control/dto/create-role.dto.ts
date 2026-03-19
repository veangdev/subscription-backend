import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Operations Manager' })
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiProperty({
    example: 'Oversees daily operations, orders, and user escalations.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;

  @ApiProperty({
    example: ['dashboard.view', 'subscriptions.view', 'shipments.edit'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permission_keys?: string[];
}
