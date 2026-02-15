import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { SubscriptionPlansService } from './subscription-plans.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlan } from './entities/subscription-plan.entity';

@ApiTags('Subscription Plans')
@ApiBearerAuth()
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly plansService: SubscriptionPlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription plan' })
  @ApiCreatedResponse({ description: 'Plan created successfully', type: SubscriptionPlan })
  create(@Body() dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    return this.plansService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscription plans' })
  @ApiOkResponse({ description: 'List of all plans', type: [SubscriptionPlan] })
  findAll(): Promise<SubscriptionPlan[]> {
    return this.plansService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription plan by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Plan found', type: SubscriptionPlan })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SubscriptionPlan> {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription plan' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Plan updated', type: SubscriptionPlan })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subscription plan' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.plansService.remove(id);
  }
}
