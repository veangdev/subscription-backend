import { ApiProperty } from '@nestjs/swagger';

export class AdminOverviewSummaryDto {
  @ApiProperty({ example: 245 })
  total_users: number;

  @ApiProperty({ example: 214 })
  active_subscribers: number;

  @ApiProperty({ example: 193 })
  active_subscriptions: number;

  @ApiProperty({ example: 18 })
  pending_shipments: number;

  @ApiProperty({ example: 27 })
  plan_variants: number;

  @ApiProperty({ example: 8421.65 })
  monthly_revenue: number;
}

export class AdminOverviewStatusItemDto {
  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 82 })
  count: number;
}

export class AdminOverviewRecentActivityItemDto {
  @ApiProperty({ example: 'subscription' })
  type: string;

  @ApiProperty({ example: 'Vansao subscribed to The Wellness Box' })
  title: string;

  @ApiProperty({ example: 'Starts on 2026-03-09' })
  subtitle: string;

  @ApiProperty({ example: 'ACTIVE', nullable: true })
  status: string | null;

  @ApiProperty({ example: '2026-03-09T03:00:00.000Z' })
  happened_at: string;
}

export class AdminOverviewResponseDto {
  @ApiProperty({ type: AdminOverviewSummaryDto })
  summary: AdminOverviewSummaryDto;

  @ApiProperty({ type: [AdminOverviewStatusItemDto] })
  subscription_statuses: AdminOverviewStatusItemDto[];

  @ApiProperty({ type: [AdminOverviewStatusItemDto] })
  shipment_statuses: AdminOverviewStatusItemDto[];

  @ApiProperty({ type: [AdminOverviewStatusItemDto] })
  payment_statuses: AdminOverviewStatusItemDto[];

  @ApiProperty({ type: [AdminOverviewRecentActivityItemDto] })
  recent_activity: AdminOverviewRecentActivityItemDto[];
}
