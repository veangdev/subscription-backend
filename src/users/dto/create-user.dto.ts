import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ example: 'securePass123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 'Subscriber', enum: ['Admin', 'Subscriber'] })
  @IsNotEmpty()
  @IsString()
  role: string;
}
