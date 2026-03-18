import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse, ApiParam } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SubscriptionPlansService } from './subscription-plans.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Product } from './entities/product.entity';
import { SubscriptionPlanStorefrontResponseDto } from './dto/subscription-plan-storefront-response.dto';
import { AddProductsToPlanDto, CreateProductDto, RemoveProductsFromPlanDto } from './dto/product.dto';
import { AdminAccessGuard } from '../access-control/guards/admin-access.guard';
import { QueryPlansDto } from './dto/query-plans.dto';

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
  @ApiOperation({ summary: 'Get all box subscription variants (paginated)' })
  @ApiOkResponse({ description: 'Paginated plans returned successfully' })
  findAll(@Query() query: QueryPlansDto) {
    return this.plansService.findAllPaginated(query);
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

  @Post(':id/image')
  @UseGuards(AdminAccessGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload or replace a plan image' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Plan image updated successfully', type: SubscriptionPlan })
  uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SubscriptionPlan> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.plansService.uploadImage(id, file);
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

  @Post('seed-products')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Seed default products and assign them to plans' })
  @ApiOkResponse({ description: 'Seeded products', type: [Product] })
  seedProducts(): Promise<Product[]> {
    return this.plansService.seedDefaultProducts();
  }

  // ── Products ──────────────────────────────────────────────────────────────

  @Get('products')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'List all products' })
  @ApiOkResponse({ description: 'All products', type: [Product] })
  findAllProducts(): Promise<Product[]> {
    return this.plansService.findAllProducts();
  }

  @Post('products')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiCreatedResponse({ description: 'Product created', type: Product })
  createProduct(@Body() dto: CreateProductDto): Promise<Product> {
    return this.plansService.createProduct(dto);
  }

  @Delete('products/:productId')
  @UseGuards(AdminAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'productId', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiNoContentResponse({ description: 'Product deleted' })
  removeProduct(@Param('productId', ParseUUIDPipe) productId: string): Promise<void> {
    return this.plansService.removeProduct(productId);
  }

  @Post(':id/products')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Add products to a subscription plan' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Plan with updated products', type: SubscriptionPlan })
  addProductsToPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddProductsToPlanDto,
  ): Promise<SubscriptionPlan> {
    return this.plansService.addProductsToPlan(id, dto);
  }

  @Delete(':id/products')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: 'Remove products from a subscription plan' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Plan with updated products', type: SubscriptionPlan })
  removeProductsFromPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemoveProductsFromPlanDto,
  ): Promise<SubscriptionPlan> {
    return this.plansService.removeProductsFromPlan(id, dto);
  }
}
