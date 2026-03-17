import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { UpdateShipmentStatusDto } from './dto/update-shipment-status.dto';
import {
  SubscriberShipmentHistoryDetailDto,
  SubscriberShipmentHistoryItemDto,
} from './dto/subscriber-shipment-history-response.dto';
import { Shipment } from './entities/shipment.entity';
import { AdminAccessGuard } from '../access-control/guards/admin-access.guard';

@ApiTags('Shipments')
@ApiBearerAuth()
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Create a new shipment' })
  @ApiCreatedResponse({ description: 'Shipment created successfully', type: Shipment })
  create(@Body() dto: CreateShipmentDto): Promise<Shipment> {
    return this.shipmentsService.create(dto);
  }

  @Get()
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Get all shipments' })
  @ApiOkResponse({ description: 'List of all shipments', type: [Shipment] })
  findAll(): Promise<Shipment[]> {
    return this.shipmentsService.findAll();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get shipment history for current authenticated user' })
  @ApiOkResponse({
    description: 'Shipment history for the current authenticated user',
    type: [SubscriberShipmentHistoryItemDto],
  })
  findHistory(@CurrentUser() user: { id: string; email: string }) {
    return this.shipmentsService.findHistoryByUser(user.id);
  }

  @Get('history/:id')
  @ApiOperation({ summary: 'Get a shipment history detail for current authenticated user' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({
    description: 'Shipment history detail for the current authenticated user',
    type: SubscriberShipmentHistoryDetailDto,
  })
  findHistoryDetail(
    @CurrentUser() user: { id: string; email: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.shipmentsService.findHistoryDetailByUser(user.id, id);
  }

  @Get(':id')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Get a shipment by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Shipment found', type: Shipment })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Shipment> {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Update a shipment' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Shipment updated', type: Shipment })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateShipmentDto): Promise<Shipment> {
    return this.shipmentsService.update(id, dto);
  }

  @Put(':id/status')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Update shipment status' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Shipment status updated', type: Shipment })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateShipmentStatusDto,
  ): Promise<Shipment> {
    return this.shipmentsService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Delete a shipment' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.shipmentsService.remove(id);
  }
}
