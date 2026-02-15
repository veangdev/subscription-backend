import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryItem } from './entities/inventory-item.entity';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item' })
  @ApiCreatedResponse({ description: 'Item created successfully', type: InventoryItem })
  create(@Body() dto: CreateInventoryItemDto): Promise<InventoryItem> {
    return this.inventoryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiOkResponse({ description: 'List of all inventory items', type: [InventoryItem] })
  findAll(): Promise<InventoryItem[]> {
    return this.inventoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an inventory item by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Item found', type: InventoryItem })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<InventoryItem> {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an inventory item' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Item updated', type: InventoryItem })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    return this.inventoryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an inventory item' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.inventoryService.remove(id);
  }
}
