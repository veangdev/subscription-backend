import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { Subscription } from './entities/subscription.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubscribeDto } from './dto/subscribe.dto';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiCreatedResponse({ description: 'Subscription created successfully', type: Subscription })
  create(@Body() dto: CreateSubscriptionDto): Promise<Subscription> {
    return this.subscriptionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiOkResponse({ description: 'List of all subscriptions', type: [Subscription] })
  findAll(): Promise<Subscription[]> {
    return this.subscriptionsService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user active subscription' })
  @ApiOkResponse({ description: 'Current active subscription (or null)' })
  findMySubscription(@CurrentUser() user: { id: string; email: string }): Promise<Subscription | null> {
    return this.subscriptionsService.findCurrentByUserId(user.id);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Create a subscription for current user' })
  @ApiCreatedResponse({ description: 'Subscription created successfully', type: Subscription })
  subscribe(
    @CurrentUser() user: { id: string; email: string },
    @Body() dto: SubscribeDto,
  ): Promise<Subscription> {
    return this.subscriptionsService.subscribeForCurrentUser(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subscription by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Subscription found', type: Subscription })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Subscription> {
    return this.subscriptionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subscription' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Subscription updated', type: Subscription })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubscriptionDto): Promise<Subscription> {
    return this.subscriptionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subscription' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.subscriptionsService.remove(id);
  }
}
