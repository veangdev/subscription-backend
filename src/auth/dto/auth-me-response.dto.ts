import { ApiProperty } from '@nestjs/swagger';

export class AuthMeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Vansao' })
  name: string;

  @ApiProperty({ example: 'vansao@example.com' })
  email: string;

  @ApiProperty({
    example: '+85512345678',
    required: false,
    nullable: true,
  })
  phone_number: string | null;

  @ApiProperty({ example: 'Subscriber' })
  role: string;

  @ApiProperty({ example: 'Active' })
  status: string;

  @ApiProperty({ example: '2026-03-08T08:15:30.000Z' })
  created_at: string;
}
