import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAccessGuard } from '../access-control/guards/admin-access.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateMyAddressDto } from './dto/create-my-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateMyAddressDto } from './dto/update-my-address.dto';

@ApiTags('Addresses')
@ApiBearerAuth()
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Create a new address' })
  create(@Body() dto: CreateAddressDto) {
    return this.addressesService.create(dto);
  }

  @Post('me')
  @ApiOperation({ summary: 'Create an address for the current authenticated user' })
  createForCurrentUser(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: CreateMyAddressDto,
  ) {
    return this.addressesService.createForUser(user.id, dto);
  }

  @Get()
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Get all addresses' })
  findAll() {
    return this.addressesService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get addresses for current authenticated user' })
  findMyAddresses(@CurrentUser() user: { id: string; email: string }) {
    return this.addressesService.findByUser(user.id);
  }

  @Get('user/:userId')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Get all addresses for a specific user' })
  findByUser(@Param('userId') userId: string) {
    return this.addressesService.findByUser(userId);
  }

  @Get('me/:id')
  @ApiOperation({ summary: 'Get a single address for the current authenticated user' })
  findMyAddress(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ) {
    return this.addressesService.findOneForUser(user.id, id);
  }

  @Get(':id')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Get a single address by ID' })
  findOne(@Param('id') id: string) {
    return this.addressesService.findOne(id);
  }

  @Patch('me/:id')
  @ApiOperation({ summary: 'Update an address for the current authenticated user' })
  updateMyAddress(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateMyAddressDto,
  ) {
    return this.addressesService.updateForUser(user.id, id, dto);
  }

  @Patch(':id')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Update an address' })
  update(@Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addressesService.update(id, dto);
  }

  @Delete('me/:id')
  @ApiOperation({ summary: 'Delete an address for the current authenticated user' })
  removeMyAddress(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ) {
    return this.addressesService.removeForUser(user.id, id);
  }

  @Delete(':id')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Delete an address' })
  remove(@Param('id') id: string) {
    return this.addressesService.remove(id);
  }
}
