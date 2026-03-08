import { ApiProperty } from '@nestjs/swagger';

export class DashboardBillingSummaryDto {
  @ApiProperty({
    example: '2026-04-07',
    required: false,
    nullable: true,
  })
  next_billing_date: string | null;

  @ApiProperty({ example: 29.99 })
  total_amount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 2 })
  subscription_count: number;
}

export class DashboardShipmentStepDto {
  @ApiProperty({ example: 'PACKED' })
  key: string;

  @ApiProperty({ example: 'Packed' })
  label: string;

  @ApiProperty({ example: true })
  completed: boolean;

  @ApiProperty({ example: false })
  current: boolean;
}

export class DashboardShipmentSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  subscription_id: string;

  @ApiProperty({ example: 'Gourmet Coffee Box' })
  subscription_name: string;

  @ApiProperty({ example: 'SHIPPED' })
  status: string;

  @ApiProperty({ example: '2026-03-08' })
  shipment_date: string;

  @ApiProperty({
    example: '2026-03-11',
    required: false,
    nullable: true,
  })
  estimated_delivery_date: string | null;

  @ApiProperty({
    example: 'BOX123456789',
    required: false,
    nullable: true,
  })
  tracking_number: string | null;

  @ApiProperty({ example: 0.67 })
  progress: number;

  @ApiProperty({ type: [DashboardShipmentStepDto] })
  steps: DashboardShipmentStepDto[];
}

export class DashboardSubscriptionSummaryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  plan_id: string;

  @ApiProperty({ example: 'Gourmet Coffee Box' })
  name: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({
    example: '2026-04-07',
    required: false,
    nullable: true,
  })
  recharge_date: string | null;

  @ApiProperty({ example: 19.99 })
  price: number;

  @ApiProperty({ example: 30 })
  frequency_in_days: number;

  @ApiProperty({ example: 'PAID' })
  billing_status: string;
}

export class SubscriberDashboardResponseDto {
  @ApiProperty({ type: DashboardBillingSummaryDto })
  billing: DashboardBillingSummaryDto;

  @ApiProperty({
    type: DashboardShipmentSummaryDto,
    required: false,
    nullable: true,
  })
  latest_shipment: DashboardShipmentSummaryDto | null;

  @ApiProperty({ type: [DashboardSubscriptionSummaryDto] })
  active_subscriptions: DashboardSubscriptionSummaryDto[];
}
