import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ type: String, format: 'uuid', description: 'User ID' })
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @ApiProperty({ example: 'male', enum: ['male', 'female'] })
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
