import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { SubscriptionPlansService } from './subscription-plans.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { SubscriptionPlanStorefrontResponseDto } from './dto/subscription-plan-storefront-response.dto';
import { AdminAccessGuard } from '../access-control/guards/admin-access.guard';

@ApiTags('Subscription Plans')
@ApiBearerAuth()
@Controller('subscription-plans')
export class SubscriptionPlansController {
  constructor(private readonly plansService: SubscriptionPlansService) {}

  @Post()
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Create a new box subscription variant' })
  @ApiCreatedResponse({ description: 'Plan created successfully', type: SubscriptionPlan })
  create(@Body() dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    return this.plansService.create(dto);
  }

  @Get()
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Get all box subscription variants' })
  @ApiOkResponse({ description: 'List of all plans', type: [SubscriptionPlan] })
  findAll(
    @Query('billingCycle') billingCycle?: 'weekly' | 'monthly' | 'yearly',
  ): Promise<SubscriptionPlan[]> {
    if (
      billingCycle &&
      billingCycle !== 'weekly' &&
      billingCycle !== 'monthly' &&
      billingCycle !== 'yearly'
    ) {
      throw new BadRequestException('billingCycle must be weekly, monthly, or yearly');
    }
    return this.plansService.findAll(billingCycle);
  }

  @Get('storefront')
  @ApiOperation({ summary: 'Get curated box plans for the mobile storefront' })
  @ApiOkResponse({
    description: 'Curated storefront response for the mobile plans screen',
    type: SubscriptionPlanStorefrontResponseDto,
  })
  getStorefrontCatalog(): Promise<SubscriptionPlanStorefrontResponseDto> {
    return this.plansService.getStorefrontCatalog();
  }

  @Get(':id')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Get a subscription plan by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Plan found', type: SubscriptionPlan })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SubscriptionPlan> {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Update a subscription plan' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Plan updated', type: SubscriptionPlan })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Delete a subscription plan' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.plansService.remove(id);
  }

  @Post('seed-defaults')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Seed default box plans and billing cadences' })
  @ApiOkResponse({ description: 'Seeded subscription plans', type: [SubscriptionPlan] })
  seedDefaults(): Promise<SubscriptionPlan[]> {
    return this.plansService.seedDefaultPlans();
  }
}
