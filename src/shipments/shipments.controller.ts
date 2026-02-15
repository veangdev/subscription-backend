import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { Shipment } from './entities/shipment.entity';

@ApiTags('Shipments')
@ApiBearerAuth()
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shipment' })
  @ApiCreatedResponse({ description: 'Shipment created successfully', type: Shipment })
  create(@Body() dto: CreateShipmentDto): Promise<Shipment> {
    return this.shipmentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipments' })
  @ApiOkResponse({ description: 'List of all shipments', type: [Shipment] })
  findAll(): Promise<Shipment[]> {
    return this.shipmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a shipment by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Shipment found', type: Shipment })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Shipment> {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shipment' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Shipment updated', type: Shipment })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateShipmentDto): Promise<Shipment> {
    return this.shipmentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shipment' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.shipmentsService.remove(id);
  }
}
