import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthMeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Vansao' })
  name: string;

  @ApiPropertyOptional({
    example: 'vansao@example.com',
    required: false,
    nullable: true,
  })
  email: string | null;

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

  @ApiPropertyOptional({
    example: 'https://storage.googleapis.com/box-images/users/user-id/profile/avatar.jpg',
    required: false,
    nullable: true,
  })
  profile_image_url: string | null;

  @ApiProperty({ example: '2026-03-08T08:15:30.000Z' })
  created_at: string;
}
