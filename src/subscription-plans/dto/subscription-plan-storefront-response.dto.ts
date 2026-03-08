import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionPlanFrequencyOptionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Monthly' })
  label: string;

  @ApiProperty({ example: 30 })
  frequency_in_days: number;

  @ApiProperty({ example: 19.0 })
  price: number;

  @ApiProperty({ example: '/mo' })
  period_label: string;
}

export class SubscriptionPlanStorefrontItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'The Wellness Box' })
  plan_name: string;

  @ApiProperty({ example: 'The Wellness Box' })
  title: string;

  @ApiProperty({
    example: 'Curated for your peace of mind. Includes 6 organic self-care essentials.',
  })
  subtitle: string;

  @ApiProperty({ example: 'Wellness' })
  category: string;

  @ApiProperty({ example: 19.0 })
  price: number;

  @ApiProperty({ example: '/mo' })
  period_label: string;

  @ApiProperty({ type: [SubscriptionPlanFrequencyOptionDto] })
  frequency_options: SubscriptionPlanFrequencyOptionDto[];

  @ApiProperty({
    type: [String],
    example: ['6 organic self-care essentials', 'Monthly wellness curation', 'Free doorstep delivery'],
  })
  features: string[];

  @ApiProperty({
    example: 'BEST VALUE',
    required: false,
    nullable: true,
  })
  badge: string | null;

  @ApiProperty({
    example: 'PICK OF THE MONTH',
    required: false,
    nullable: true,
  })
  featured_label: string | null;

  @ApiProperty({ example: 4.9 })
  rating: number;

  @ApiProperty({ example: true })
  is_featured: boolean;
}

export class SubscriptionPlanStorefrontResponseDto {
  @ApiProperty({
    type: [String],
    example: ['All', 'Beauty', 'Tech', 'Snacks', 'Wellness'],
  })
  categories: string[];

  @ApiProperty({
    type: SubscriptionPlanStorefrontItemDto,
    required: false,
    nullable: true,
  })
  featured_plan: SubscriptionPlanStorefrontItemDto | null;

  @ApiProperty({ type: [SubscriptionPlanStorefrontItemDto] })
  plans: SubscriptionPlanStorefrontItemDto[];
}
