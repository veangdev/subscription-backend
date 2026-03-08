import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '+85512345678', description: 'Cambodia phone number' })
  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @ApiProperty({ example: 'securePass123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
