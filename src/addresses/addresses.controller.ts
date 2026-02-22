import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('Addresses')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  create(@Body() dto: CreateAddressDto) {
    return this.addressesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all addresses' })
  findAll() {
    return this.addressesService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all addresses for a specific user' })
  findByUser(@Param('userId') userId: string) {
    return this.addressesService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single address by ID' })
  findOne(@Param('id') id: string) {
    return this.addressesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  update(@Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addressesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  remove(@Param('id') id: string) {
    return this.addressesService.remove(id);
  }
}
