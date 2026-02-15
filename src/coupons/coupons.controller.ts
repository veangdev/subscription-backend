import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { Coupon } from './entities/coupon.entity';

@ApiTags('Coupons')
@ApiBearerAuth()
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new coupon' })
  @ApiCreatedResponse({ description: 'Coupon created successfully', type: Coupon })
  create(@Body() dto: CreateCouponDto): Promise<Coupon> {
    return this.couponsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all coupons' })
  @ApiOkResponse({ description: 'List of all coupons', type: [Coupon] })
  findAll(): Promise<Coupon[]> {
    return this.couponsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a coupon by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Coupon found', type: Coupon })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Coupon> {
    return this.couponsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a coupon' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Coupon updated', type: Coupon })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCouponDto): Promise<Coupon> {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a coupon' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.couponsService.remove(id);
  }
}
