import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Product } from './entities/product.entity';
import { QueryPlansDto } from './dto/query-plans.dto';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import {
  SubscriptionPlanFrequencyOptionDto,
  SubscriptionPlanStorefrontItemDto,
  SubscriptionPlanStorefrontResponseDto,
} from './dto/subscription-plan-storefront-response.dto';
import {
  AddProductsToPlanDto,
  CreateProductDto,
  ProductDto,
  RemoveProductsFromPlanDto,
} from './dto/product.dto';
import { FileStorageService } from '../file-storage/file-storage.service';

type BillingCycle = 'weekly' | 'monthly' | 'yearly';
type StorefrontPreset = {
  plan_name: string;
  title: string;
  subtitle: string;
  category: string;
  features: string[];
  badge?: string;
  featured_label?: string;
  rating: number;
};

@Injectable()
export class SubscriptionPlansService {
  private readonly defaultPlans: Array<{
    name: string;
    frequency_in_days: number;
    price: number;
  }> = [
    { name: 'The Wellness Box', frequency_in_days: 7, price: 6.99 },
    { name: 'The Wellness Box', frequency_in_days: 30, price: 19.0 },
    { name: 'The Wellness Box', frequency_in_days: 365, price: 182.4 },
    { name: 'Eco-Home Essentials', frequency_in_days: 7, price: 10.99 },
    { name: 'Eco-Home Essentials', frequency_in_days: 30, price: 29.99 },
    { name: 'Eco-Home Essentials', frequency_in_days: 365, price: 287.9 },
    { name: "Gamer's Loot", frequency_in_days: 7, price: 15.99 },
    { name: "Gamer's Loot", frequency_in_days: 30, price: 45.0 },
    { name: "Gamer's Loot", frequency_in_days: 365, price: 432.0 },
    { name: 'Snack Stash Express', frequency_in_days: 7, price: 5.99 },
    { name: 'Snack Stash Express', frequency_in_days: 30, price: 14.99 },
    { name: 'Snack Stash Express', frequency_in_days: 365, price: 143.9 },
    { name: 'Glow Ritual Box', frequency_in_days: 7, price: 8.99 },
    { name: 'Glow Ritual Box', frequency_in_days: 30, price: 24.99 },
    { name: 'Glow Ritual Box', frequency_in_days: 365, price: 239.9 },
  ];
  private readonly storefrontCategories = ['All', 'Beauty', 'Tech', 'Snacks', 'Wellness'];
  private readonly storefrontFeaturedPlanName = 'The Wellness Box';
  private readonly storefrontPresets: Record<string, StorefrontPreset> = Object.fromEntries([
    {
      plan_name: 'The Wellness Box',
      title: 'The Wellness Box',
      subtitle: 'Curated for your peace of mind. Includes 6 organic self-care essentials.',
      category: 'Wellness',
      features: [
        '6 organic self-care essentials',
        'Monthly wellness curation',
        'Free doorstep delivery',
      ],
      featured_label: 'PICK OF THE MONTH',
      rating: 4.9,
    },
    {
      plan_name: 'Eco-Home Essentials',
      title: 'Eco-Home Essentials',
      subtitle: 'Green living made simple with zero-waste home supplies.',
      category: 'Wellness',
      features: [
        'Zero-waste home supplies',
        'Thoughtfully sourced eco picks',
        'Monthly refill-ready bundle',
      ],
      badge: 'BEST VALUE',
      rating: 4.9,
    },
    {
      plan_name: "Gamer's Loot",
      title: "Gamer's Loot",
      subtitle: 'Top-tier peripherals, accessories, and fuel for late-night sessions.',
      category: 'Tech',
      features: [
        'Premium gaming accessories',
        'High-performance gear picks',
        'Late-night snack extras',
      ],
      badge: 'POPULAR',
      rating: 4.8,
    },
    {
      plan_name: 'Snack Stash Express',
      title: 'Snack Stash Express',
      subtitle: 'Sweet, savory, and seasonal treats delivered for every craving.',
      category: 'Snacks',
      features: [
        'Sweet and savory snack rotation',
        'Seasonal limited-edition treats',
        'Quick monthly delivery',
      ],
      badge: 'TRENDING',
      rating: 4.7,
    },
    {
      plan_name: 'Glow Ritual Box',
      title: 'Glow Ritual Box',
      subtitle: 'Skin-loving beauty picks for a polished self-care routine.',
      category: 'Beauty',
      features: [
        'Beauty and skincare essentials',
        'Glow-focused monthly routine',
        'Exclusive editor picks',
      ],
      badge: 'EDITOR PICK',
      rating: 4.9,
    },
  ].map((preset) => [preset.plan_name, preset]));

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly plansRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = this.plansRepository.create(dto);
    return this.plansRepository.save(plan);
  }

  async findAll(billingCycle?: BillingCycle): Promise<SubscriptionPlan[]> {
    const query = this.plansRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.products', 'product')
      .orderBy(
        `CASE plan.name
          WHEN 'The Wellness Box' THEN 1
          WHEN 'Eco-Home Essentials' THEN 2
          WHEN 'Gamer''s Loot' THEN 3
          WHEN 'Snack Stash Express' THEN 4
          WHEN 'Glow Ritual Box' THEN 5
          ELSE 99
        END`,
      )
      .addOrderBy('plan.frequency_in_days', 'ASC');

    if (billingCycle === 'weekly') {
      query.andWhere('plan.frequency_in_days <= :weeklyDays', { weeklyDays: 7 });
    } else if (billingCycle === 'monthly') {
      query.andWhere('plan.frequency_in_days <= :monthlyDays', { monthlyDays: 31 });
    } else if (billingCycle === 'yearly') {
      query.andWhere('plan.frequency_in_days >= :yearlyDays', { yearlyDays: 360 });
    }

    return query.getMany();
  }

  async findAllPaginated(query: QueryPlansDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.plansRepository
      .createQueryBuilder('plan')
      .leftJoinAndSelect('plan.products', 'product')
      .orderBy(
        `CASE plan.name
          WHEN 'The Wellness Box' THEN 1
          WHEN 'Eco-Home Essentials' THEN 2
          WHEN 'Gamer''s Loot' THEN 3
          WHEN 'Snack Stash Express' THEN 4
          WHEN 'Glow Ritual Box' THEN 5
          ELSE 99
        END`,
      )
      .addOrderBy('plan.frequency_in_days', 'ASC');

    if (query.search?.trim()) {
      const s = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `LOWER(plan.name) LIKE :s OR LOWER(COALESCE(plan.description, '')) LIKE :s`,
        { s },
      );
    }

    if (query.billingCycle === 'weekly') {
      qb.andWhere('plan.frequency_in_days <= :weeklyDays', { weeklyDays: 7 });
    } else if (query.billingCycle === 'monthly') {
      qb.andWhere('plan.frequency_in_days <= :monthlyDays', { monthlyDays: 31 });
    } else if (query.billingCycle === 'yearly') {
      qb.andWhere('plan.frequency_in_days >= :yearlyDays', { yearlyDays: 360 });
    }

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();

    const allPlans = await this.plansRepository.find({ select: ['id', 'name', 'frequency_in_days'] });
    const uniqueBoxes = new Set(allPlans.map((p) => p.name)).size;
    const weeklyCount = allPlans.filter((p) => p.frequency_in_days <= 7).length;
    const yearlyCount = allPlans.filter((p) => p.frequency_in_days >= 360).length;
    const monthlyCount = allPlans.length - weeklyCount - yearlyCount;

    return {
      items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
        summary: {
          total_variants: allPlans.length,
          total_boxes: uniqueBoxes,
          weekly_count: weeklyCount,
          monthly_count: monthlyCount,
          yearly_count: yearlyCount,
        },
      },
    };
  }

  async getStorefrontCatalog(): Promise<SubscriptionPlanStorefrontResponseDto> {
    const allPlans = await this.findAll();
    const presetPlanNames = Object.keys(this.storefrontPresets);
    const groupedPlans = presetPlanNames
      .map((planName) => ({
        planName,
        plans: allPlans
          .filter((plan) => plan.name === planName)
          .sort((left, right) => left.frequency_in_days - right.frequency_in_days),
      }))
      .filter(({ plans }) => plans.length > 0);

    if (groupedPlans.length === 0) {
      return {
        categories: this.storefrontCategories,
        featured_plan: null,
        plans: [],
      };
    }

    const featuredGroup =
      groupedPlans.find((group) => group.planName === this.storefrontFeaturedPlanName) ?? groupedPlans[0];
    const remainingGroups = groupedPlans.filter((group) => group.planName !== featuredGroup.planName);

    return {
      categories: this.storefrontCategories,
      featured_plan: this.buildStorefrontItem(featuredGroup.plans, true),
      plans: remainingGroups.map((group) =>
        this.buildStorefrontItem(group.plans, false),
      ),
    };
  }

  async findOne(id: string): Promise<SubscriptionPlan> {
    const plan = await this.plansRepository.findOne({ where: { id }, relations: ['products'] });
    if (!plan) throw new NotFoundException(`Plan #${id} not found`);
    return plan;
  }

  async findAllProducts(): Promise<Product[]> {
    return this.productsRepository.find({ order: { name: 'ASC' } });
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({
      ...dto,
      description: dto.description ?? null,
      category: dto.category ?? null,
      sku: dto.sku ?? null,
      weight_kg: dto.weight_kg ?? null,
      dimensions: dto.dimensions ?? null,
      image_url: null,
    });
    return this.productsRepository.save(product);
  }

  async removeProduct(productId: string): Promise<void> {
    const product = await this.productsRepository.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product #${productId} not found`);
    await this.productsRepository.remove(product);
  }

  async addProductsToPlan(planId: string, dto: AddProductsToPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findOne(planId);
    const newProducts = await this.productsRepository.findBy({ id: In(dto.product_ids) });
    const missing = dto.product_ids.filter((pid) => !newProducts.find((p) => p.id === pid));
    if (missing.length > 0) {
      throw new NotFoundException(`Products not found: ${missing.join(', ')}`);
    }
    const existingIds = new Set(plan.products.map((p) => p.id));
    const toAdd = newProducts.filter((p) => !existingIds.has(p.id));
    plan.products = [...plan.products, ...toAdd];
    return this.plansRepository.save(plan);
  }

  async removeProductsFromPlan(planId: string, dto: RemoveProductsFromPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findOne(planId);
    const removeSet = new Set(dto.product_ids);
    plan.products = plan.products.filter((p) => !removeSet.has(p.id));
    return this.plansRepository.save(plan);
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    await this.findOne(id);
    await this.plansRepository.update(id, dto);
    return this.findOne(id);
  }

  async uploadImage(id: string, file: Express.Multer.File): Promise<SubscriptionPlan> {
    this.assertImageFile(file);

    const plan = await this.findOne(id);
    const uploadedImage = await this.fileStorageService.storeImage({
      folder: `plans/${plan.id}`,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
    });

    if (plan.image_url) {
      await this.fileStorageService.deleteByPublicUrl(plan.image_url);
    }

    plan.image_url = uploadedImage.publicUrl;
    return this.plansRepository.save(plan);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.plansRepository.delete(id);
  }

  async seedDefaultPlans(): Promise<SubscriptionPlan[]> {
    for (const plan of this.defaultPlans) {
      const existing = await this.plansRepository.findOne({
        where: { name: plan.name, frequency_in_days: plan.frequency_in_days },
      });

      if (existing) {
        if (Number(existing.price) !== Number(plan.price)) {
          await this.plansRepository.update(existing.id, { price: plan.price });
        }
        continue;
      }

      const created = this.plansRepository.create(plan);
      await this.plansRepository.save(created);
    }

    return this.findAll();
  }

  async seedDefaultProducts(): Promise<Product[]> {
    const seeds: Array<{ planName: string; product: Omit<Product, 'id' | 'plans'> }> = [
      // The Wellness Box
      { planName: 'The Wellness Box', product: { name: 'Lavender Foam Cleanser', description: 'A gentle foaming cleanser infused with lavender extract to soothe and refresh skin.', category: 'Skincare', price: 4.99, image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80', sku: 'LFC-001', weight_kg: 0.25, dimensions: '10x5x3 cm' } },
      { planName: 'The Wellness Box', product: { name: 'Organic Rosehip Face Oil', description: 'Cold-pressed rosehip oil rich in vitamins A and C to brighten and hydrate.', category: 'Skincare', price: 8.99, image_url: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80', sku: 'ORF-002', weight_kg: 0.12, dimensions: '5x5x8 cm' } },
      { planName: 'The Wellness Box', product: { name: 'Eucalyptus Body Scrub', description: 'Invigorating sugar scrub with eucalyptus oil to exfoliate and revive tired skin.', category: 'Body Care', price: 5.99, image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80', sku: 'EBS-003', weight_kg: 0.35, dimensions: '9x6x4 cm' } },
      { planName: 'The Wellness Box', product: { name: 'Chamomile Sleep Tea (12 bags)', description: 'Caffeine-free chamomile blend to support relaxation and restful sleep.', category: 'Wellness', price: 3.49, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', sku: 'CST-004', weight_kg: 0.08, dimensions: '15x8x4 cm' } },
      { planName: 'The Wellness Box', product: { name: 'Bamboo Facial Rounds (50pk)', description: 'Reusable and washable bamboo rounds — a sustainable swap for cotton pads.', category: 'Accessories', price: 2.99, image_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80', sku: 'BFR-005', weight_kg: 0.11, dimensions: '12x12x4 cm' } },
      { planName: 'The Wellness Box', product: { name: 'Peppermint Foot Balm', description: 'Cooling peppermint balm that soothes aching feet and softens rough heels.', category: 'Body Care', price: 6.49, image_url: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=400&q=80', sku: 'PFB-006', weight_kg: 0.18, dimensions: '7x7x5 cm' } },
      // Eco-Home Essentials
      { planName: 'Eco-Home Essentials', product: { name: 'Beeswax Reusable Wraps (3pk)', description: 'Plastic-free food wraps made from organic cotton and beeswax — dishwasher safe.', category: 'Kitchen', price: 9.99, image_url: 'https://images.unsplash.com/photo-1611735341450-74d61e660ad2?w=400&q=80', sku: 'BRW-007', weight_kg: 0.15, dimensions: '20x15x1 cm' } },
      { planName: 'Eco-Home Essentials', product: { name: 'Bamboo Dish Brush Set', description: 'Natural bamboo handle brushes with sisal bristles, biodegradable and long-lasting.', category: 'Kitchen', price: 7.49, image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', sku: 'BDB-008', weight_kg: 0.22, dimensions: '25x5x5 cm' } },
      { planName: 'Eco-Home Essentials', product: { name: 'Castile Soap Bar', description: 'Pure olive-oil castile bar free from sulfates, parabens, and synthetic fragrance.', category: 'Cleaning', price: 4.49, image_url: 'https://images.unsplash.com/photo-1607006483224-17433168dc6f?w=400&q=80', sku: 'CSB-009', weight_kg: 0.12, dimensions: '9x5x2 cm' } },
      { planName: 'Eco-Home Essentials', product: { name: 'Linen Produce Bags (5pk)', description: 'Lightweight organic linen bags for zero-waste grocery shopping.', category: 'Kitchen', price: 8.99, image_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80', sku: 'LPB-010', weight_kg: 0.09, dimensions: '30x25x1 cm' } },
      { planName: 'Eco-Home Essentials', product: { name: 'Glass Spray Bottle 500ml', description: 'Amber borosilicate glass spray bottle — refillable and UV-protective for DIY cleaners.', category: 'Cleaning', price: 11.99, image_url: 'https://images.unsplash.com/photo-1514996937319-344454492b37?w=400&q=80', sku: 'GSB-011', weight_kg: 0.38, dimensions: '26x7x7 cm' } },
      { planName: 'Eco-Home Essentials', product: { name: 'Wool Dryer Balls (4pk)', description: 'New Zealand wool dryer balls that reduce drying time and soften laundry naturally.', category: 'Laundry', price: 12.99, image_url: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&q=80', sku: 'WDB-012', weight_kg: 0.35, dimensions: '18x12x8 cm' } },
      // Gamer's Loot
      { planName: "Gamer's Loot", product: { name: 'RGB Keycap Puller Tool', description: 'Wire keycap puller with ergonomic grip for safe keyboard customisation.', category: 'Accessories', price: 6.99, image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80', sku: 'RKP-013', weight_kg: 0.05, dimensions: '8x4x2 cm' } },
      { planName: "Gamer's Loot", product: { name: 'Gaming Thumb Grips (4pk)', description: 'High-friction silicone thumb grips for PS and Xbox controllers.', category: 'Accessories', price: 4.99, image_url: 'https://images.unsplash.com/photo-1592840062661-a5a7f78e2056?w=400&q=80', sku: 'GTG-014', weight_kg: 0.06, dimensions: '10x5x2 cm' } },
      { planName: "Gamer's Loot", product: { name: 'Braided USB-C Cable 2m', description: 'Heavy-duty nylon braided USB-C cable with 60W fast-charge support.', category: 'Cables', price: 7.99, image_url: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&q=80', sku: 'BUC-015', weight_kg: 0.11, dimensions: '20x8x3 cm' } },
      { planName: "Gamer's Loot", product: { name: 'Energy Drink Powder Sachets (5pk)', description: 'Sugar-free gaming fuel with B-vitamins, caffeine, and electrolytes.', category: 'Snacks', price: 8.49, image_url: 'https://images.unsplash.com/photo-1622543925917-763c34d1a86e?w=400&q=80', sku: 'EDP-016', weight_kg: 0.12, dimensions: '15x10x2 cm' } },
      { planName: "Gamer's Loot", product: { name: 'Screen Cleaning Kit', description: 'Microfiber cloth and streak-free spray solution for monitors and headsets.', category: 'Accessories', price: 5.49, image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80', sku: 'SCK-017', weight_kg: 0.09, dimensions: '12x7x5 cm' } },
      { planName: "Gamer's Loot", product: { name: 'Cable Management Clips (10pk)', description: 'Adhesive desk cable clips to keep your gaming setup tidy.', category: 'Accessories', price: 3.99, image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80', sku: 'CMC-018', weight_kg: 0.04, dimensions: '10x5x2 cm' } },
      // Snack Stash Express
      { planName: 'Snack Stash Express', product: { name: 'Sea Salt Dark Chocolate Bar', description: '70% cacao single-origin dark chocolate finished with flaky sea salt.', category: 'Chocolate', price: 3.99, image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80', sku: 'SDC-019', weight_kg: 0.10, dimensions: '15x8x1 cm' } },
      { planName: 'Snack Stash Express', product: { name: 'Roasted Chickpea Mix 120g', description: 'Smoky paprika roasted chickpeas — a high-protein crunchy snack.', category: 'Savory', price: 2.99, image_url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80', sku: 'RCM-020', weight_kg: 0.13, dimensions: '16x10x4 cm' } },
      { planName: 'Snack Stash Express', product: { name: 'Matcha Almond Granola Bar', description: 'Chewy oat bar with ceremonial matcha, toasted almonds, and honey.', category: 'Bars', price: 2.49, image_url: 'https://images.unsplash.com/photo-1605789538467-f715d58e03f9?w=400&q=80', sku: 'MAG-021', weight_kg: 0.07, dimensions: '14x5x1 cm' } },
      { planName: 'Snack Stash Express', product: { name: 'Spicy Mango Fruit Leather', description: 'All-natural mango fruit leather dusted with tajín-style chili salt.', category: 'Fruit Snacks', price: 1.99, image_url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80', sku: 'SMF-022', weight_kg: 0.04, dimensions: '15x5x0.5 cm' } },
      { planName: 'Snack Stash Express', product: { name: 'Mixed Berry Trail Mix 100g', description: 'A blend of dried blueberries, cranberries, cashews, and pumpkin seeds.', category: 'Trail Mix', price: 3.49, image_url: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=400&q=80', sku: 'MBT-023', weight_kg: 0.11, dimensions: '14x9x4 cm' } },
      { planName: 'Snack Stash Express', product: { name: 'Oat & Honey Biscuits (6pk)', description: 'Lightly sweetened whole grain oat biscuits baked with raw honey.', category: 'Biscuits', price: 2.79, image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', sku: 'OHB-024', weight_kg: 0.16, dimensions: '18x10x5 cm' } },
      // Glow Ritual Box
      { planName: 'Glow Ritual Box', product: { name: 'Vitamin C Brightening Serum', description: '15% L-ascorbic acid serum to even skin tone and boost radiance.', category: 'Serums', price: 12.99, image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80', sku: 'VCB-025', weight_kg: 0.05, dimensions: '4x4x10 cm' } },
      { planName: 'Glow Ritual Box', product: { name: 'Hyaluronic Acid Moisturiser', description: 'Lightweight gel moisturiser with multi-weight hyaluronic acid for all-day hydration.', category: 'Moisturisers', price: 9.99, image_url: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&q=80', sku: 'HAM-026', weight_kg: 0.07, dimensions: '5x5x9 cm' } },
      { planName: 'Glow Ritual Box', product: { name: 'Rose Quartz Gua Sha Tool', description: 'Genuine rose quartz gua sha for facial massage to reduce puffiness and sculpt.', category: 'Tools', price: 15.99, image_url: 'https://images.unsplash.com/photo-1601049541271-f68d5ec1a75f?w=400&q=80', sku: 'RQG-027', weight_kg: 0.08, dimensions: '10x5x0.5 cm' } },
      { planName: 'Glow Ritual Box', product: { name: 'Collagen Eye Patches (5 pairs)', description: 'Hydrogel eye patches infused with collagen and niacinamide to reduce dark circles.', category: 'Eye Care', price: 6.49, image_url: 'https://images.unsplash.com/photo-1590156206657-aec4e9c62b23?w=400&q=80', sku: 'CEP-028', weight_kg: 0.03, dimensions: '12x8x1 cm' } },
      { planName: 'Glow Ritual Box', product: { name: 'SPF30 Face Mist 100ml', description: 'Lightweight refreshing mist with broad-spectrum SPF30 and nourishing aloe vera.', category: 'Sun Care', price: 11.99, image_url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80', sku: 'FMS-029', weight_kg: 0.14, dimensions: '8x4x4 cm' } },
      { planName: 'Glow Ritual Box', product: { name: 'Micellar Cleansing Water 150ml', description: 'No-rinse micellar water that gently removes makeup, SPF, and impurities.', category: 'Cleansers', price: 5.99, image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80', sku: 'MCW-030', weight_kg: 0.17, dimensions: '6x6x14 cm' } },
    ];

    // Upsert products by SKU
    const savedBySku = new Map<string, Product>();
    for (const { product: seed } of seeds) {
      const existing = await this.productsRepository.findOne({ where: { sku: seed.sku! } });
      if (existing) {
        savedBySku.set(existing.sku!, existing);
        continue;
      }
      const created = this.productsRepository.create(seed);
      const saved = await this.productsRepository.save(created);
      savedBySku.set(saved.sku!, saved);
    }

    // Group by plan name then assign
    const planNames = [...new Set(seeds.map((s) => s.planName))];
    for (const planName of planNames) {
      const planProducts = seeds
        .filter((s) => s.planName === planName)
        .map((s) => savedBySku.get(s.product.sku!))
        .filter((p): p is Product => p !== undefined);

      const plans = await this.plansRepository.find({
        where: { name: planName },
        relations: ['products'],
      });

      for (const plan of plans) {
        const existingIds = new Set(plan.products.map((p) => p.id));
        const toAdd = planProducts.filter((p) => !existingIds.has(p.id));
        if (toAdd.length === 0) continue;
        plan.products = [...plan.products, ...toAdd];
        await this.plansRepository.save(plan);
      }
    }

    return this.productsRepository.find({ order: { name: 'ASC' } });
  }

  private buildStorefrontItem(
    plans: SubscriptionPlan[],
    isFeatured: boolean,
  ): SubscriptionPlanStorefrontItemDto {
    const representativePlan =
      plans.find((plan) => plan.frequency_in_days <= 31 && plan.frequency_in_days >= 28)
      ?? plans.find((plan) => plan.frequency_in_days < 360)
      ?? plans[0];
    const preset = this.storefrontPresets[representativePlan.name] ?? this.buildFallbackPreset(representativePlan);

    return {
      id: representativePlan.id,
      plan_name: representativePlan.name,
      title: preset.title,
      subtitle: preset.subtitle,
      category: preset.category,
      price: Number(representativePlan.price),
      image_url: representativePlan.image_url ?? null,
      period_label: this.resolvePeriodLabel(representativePlan.frequency_in_days),
      frequency_options: plans.map((plan) => this.buildFrequencyOption(plan)),
      features: preset.features,
      badge: isFeatured ? null : preset.badge ?? null,
      featured_label: isFeatured ? preset.featured_label ?? 'FEATURED' : null,
      rating: preset.rating,
      is_featured: isFeatured,
      products: representativePlan.products?.map((p) => this.toProductDto(p)) ?? [],
    };
  }

  private toProductDto(product: Product): ProductDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: Number(product.price),
      image_url: product.image_url,
      sku: product.sku,
      weight_kg: product.weight_kg !== null ? Number(product.weight_kg) : null,
      dimensions: product.dimensions,
    };
  }

  private buildFallbackPreset(
    plan: SubscriptionPlan,
  ): StorefrontPreset {
    const title = plan.name.endsWith('Box') ? plan.name : `${plan.name} Box`;
    const category = this.storefrontCategories[1];

    return {
      plan_name: plan.name,
      title,
      subtitle: `A curated ${category.toLowerCase()} subscription delivered every ${plan.frequency_in_days} days.`,
      category,
      features: [
        `${category} favorites curated for your routine`,
        `${this.resolveFrequencyLabel(plan.frequency_in_days)} delivery schedule`,
        'Flexible subscription access',
      ],
      badge: 'NEW',
      rating: 4.6,
    };
  }

  private buildFrequencyOption(plan: SubscriptionPlan): SubscriptionPlanFrequencyOptionDto {
    return {
      id: plan.id,
      label: this.resolveFrequencyLabel(plan.frequency_in_days),
      frequency_in_days: plan.frequency_in_days,
      price: Number(plan.price),
      period_label: this.resolvePeriodLabel(plan.frequency_in_days),
    };
  }

  private resolveFrequencyLabel(frequencyInDays: number): string {
    if (frequencyInDays >= 360) {
      return 'Yearly';
    }
    if ([89, 90, 91, 92].includes(frequencyInDays)) {
      return 'Every 3 months';
    }
    if (frequencyInDays === 14) {
      return 'Every 2 weeks';
    }
    if (frequencyInDays === 7) {
      return 'Weekly';
    }
    return 'Monthly';
  }

  private resolvePeriodLabel(frequencyInDays: number): string {
    if (frequencyInDays >= 360) {
      return '/yr';
    }
    if ([89, 90, 91, 92].includes(frequencyInDays)) {
      return '/3mo';
    }
    if (frequencyInDays === 14) {
      return '/2wk';
    }
    if (frequencyInDays === 7) {
      return '/wk';
    }
    return '/mo';
  }

  private assertImageFile(file: Express.Multer.File): void {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image uploads are allowed');
    }
  }
}
