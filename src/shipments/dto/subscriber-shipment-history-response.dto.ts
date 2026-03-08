import { ApiProperty } from '@nestjs/swagger';

export class SubscriberShipmentHistoryItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Pro' })
  plan_name: string;

  @ApiProperty({ example: '2026-03-08' })
  shipment_date: string;

  @ApiProperty({ example: 'SHIPPED' })
  status: string;

  @ApiProperty({
    example: 'BOX123456789',
    required: false,
    nullable: true,
  })
  tracking_number: string | null;

  @ApiProperty({ example: 19.99 })
  amount: number;

  @ApiProperty({ example: 'USD' })
  currency: string;
}

export class SubscriberShipmentAddressDto {
  @ApiProperty({ example: 'Vansao' })
  contact_name: string;

  @ApiProperty({
    example: '+85512345678',
    required: false,
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    example: '123 Main Street, Phnom Penh',
    required: false,
    nullable: true,
  })
  address: string | null;
}

export class SubscriberShipmentHistoryDetailDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Pro' })
  plan_name: string;

  @ApiProperty({ example: '2026-03-08' })
  shipment_date: string;

  @ApiProperty({ example: 'SHIPPED' })
  status: string;

  @ApiProperty({
    example: 'BOX123456789',
    required: false,
    nullable: true,
  })
  tracking_number: string | null;

  @ApiProperty({ example: 19.99 })
  amount: number;

  @ApiProperty({ example: 'SUCCESS' })
  payment_status: string;

  @ApiProperty({
    example: '2026-03-08T08:15:30.000Z',
    required: false,
    nullable: true,
  })
  payment_date: string | null;

  @ApiProperty({ example: 'ACTIVE' })
  subscription_status: string;

  @ApiProperty({
    example: '2026-03-01',
    required: false,
    nullable: true,
  })
  subscription_start_date: string | null;

  @ApiProperty({
    example: '2026-03-31',
    required: false,
    nullable: true,
  })
  subscription_end_date: string | null;

  @ApiProperty({ example: '/mo' })
  period_label: string;

  @ApiProperty({ type: SubscriberShipmentAddressDto })
  shipping_address: SubscriberShipmentAddressDto;
}
