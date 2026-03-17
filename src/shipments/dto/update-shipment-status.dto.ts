import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateShipmentStatusDto {
  @ApiProperty({ example: 'SHIPPED', enum: ['PENDING', 'SHIPPED', 'DELIVERED'] })
  @IsNotEmpty()
  @IsIn(['PENDING', 'PACKED', 'SHIPPED', 'DELIVERED'])
  status: string;
}
