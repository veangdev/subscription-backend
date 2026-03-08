import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreateMyAddressDto {
  @ApiProperty({ example: 'female', enum: ['male', 'female'] })
  @IsNotEmpty()
  @IsIn(['male', 'female'])
  gender: string;

  @ApiProperty({ example: '+1234567890' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: '123 Main St, City, Country' })
  @IsNotEmpty()
  @IsString()
  address: string;
}
