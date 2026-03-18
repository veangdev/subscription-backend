import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { AdminAccessGuard } from '../access-control/guards/admin-access.guard';
import { QueryPaymentsDto } from './dto/query-payments.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(AdminAccessGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiCreatedResponse({ description: 'Payment created successfully', type: Payment })
  create(@Body() dto: CreatePaymentDto): Promise<Payment> {
    return this.paymentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments (paginated)' })
  @ApiOkResponse({ description: 'Paginated payments returned successfully' })
  findAll(@Query() query: QueryPaymentsDto) {
    return this.paymentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Payment found', type: Payment })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Payment> {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Payment updated', type: Payment })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePaymentDto): Promise<Payment> {
    return this.paymentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.paymentsService.remove(id);
  }
}
