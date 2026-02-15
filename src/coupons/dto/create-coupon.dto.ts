import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ example: 'SAVE20', description: 'Unique coupon code' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 20.0, description: 'Discount percentage' })
  @IsNotEmpty()
  @IsNumber()
  discount: number;

  @ApiProperty({ example: '2025-12-31', description: 'Expiry date (YYYY-MM-DD)' })
  @IsNotEmpty()
  @IsDateString()
  expiry_date: string;
}
