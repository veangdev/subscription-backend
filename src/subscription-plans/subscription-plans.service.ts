import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import {
  SubscriptionPlanStorefrontItemDto,
  SubscriptionPlanStorefrontResponseDto,
} from './dto/subscription-plan-storefront-response.dto';

type BillingCycle = 'monthly' | 'yearly';
type StorefrontPreset = {
  title: string;
  subtitle: string;
  category: string;
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
    { name: 'Starter', frequency_in_days: 30, price: 9 },
    { name: 'Pro', frequency_in_days: 30, price: 19 },
    { name: 'Business', frequency_in_days: 30, price: 49 },
    // Yearly plans at 20% discount vs monthly * 12
    { name: 'Starter', frequency_in_days: 365, price: 86.4 },
    { name: 'Pro', frequency_in_days: 365, price: 182.4 },
    { name: 'Business', frequency_in_days: 365, price: 470.4 },
  ];
  private readonly storefrontCategories = ['All', 'Beauty', 'Tech', 'Snacks', 'Wellness'];
  private readonly storefrontPresets: StorefrontPreset[] = [
    {
      title: 'The Wellness Box',
      subtitle: 'Curated for your peace of mind. Includes 6 organic self-care essentials.',
      category: 'Wellness',
      featured_label: 'PICK OF THE MONTH',
      rating: 4.9,
    },
    {
      title: 'Eco-Home Essentials',
      subtitle: 'Green living made simple with zero-waste home supplies.',
      category: 'Wellness',
      badge: 'BEST VALUE',
      rating: 4.9,
    },
    {
      title: "Gamer's Loot",
      subtitle: 'Top-tier peripherals, accessories, and fuel for late-night sessions.',
      category: 'Tech',
      badge: 'POPULAR',
      rating: 4.8,
    },
    {
      title: 'Snack Stash Express',
      subtitle: 'Sweet, savory, and seasonal treats delivered for every craving.',
      category: 'Snacks',
      badge: 'TRENDING',
      rating: 4.7,
    },
    {
      title: 'Glow Ritual Box',
      subtitle: 'Skin-loving beauty picks for a polished self-care routine.',
      category: 'Beauty',
      badge: 'EDITOR PICK',
      rating: 4.9,
    },
  ];

  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly plansRepository: Repository<SubscriptionPlan>,
  ) {}

  create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = this.plansRepository.create(dto);
    return this.plansRepository.save(plan);
  }

  async findAll(billingCycle?: BillingCycle): Promise<SubscriptionPlan[]> {
    const query = this.plansRepository
      .createQueryBuilder('plan')
      .orderBy(
        `CASE plan.name
          WHEN 'Starter' THEN 1
          WHEN 'Pro' THEN 2
          WHEN 'Business' THEN 3
          ELSE 99
        END`,
      )
      .addOrderBy('plan.frequency_in_days', 'ASC');

    if (billingCycle === 'monthly') {
      query.andWhere('plan.frequency_in_days <= :monthlyDays', { monthlyDays: 31 });
    } else if (billingCycle === 'yearly') {
      query.andWhere('plan.frequency_in_days >= :yearlyDays', { yearlyDays: 360 });
    }

    return query.getMany();
  }

  async getStorefrontCatalog(): Promise<SubscriptionPlanStorefrontResponseDto> {
    const allPlans = await this.findAll();
    const monthlyPlans = allPlans
      .filter((plan) => plan.frequency_in_days <= 31)
      .sort((left, right) => Number(left.price) - Number(right.price));
    const sourcePlans = monthlyPlans.length > 0 ? monthlyPlans : allPlans;

    if (sourcePlans.length === 0) {
      return {
        categories: this.storefrontCategories,
        featured_plan: null,
        plans: [],
      };
    }

    const featuredPlanIndex = sourcePlans.length > 1 ? 1 : 0;
    const featuredPlan = this.buildStorefrontItem(
      sourcePlans[featuredPlanIndex],
      0,
      true,
    );
    const remainingPlans = sourcePlans.filter((_, index) => index !== featuredPlanIndex);

    return {
      categories: this.storefrontCategories,
      featured_plan: featuredPlan,
      plans: remainingPlans.map((plan, index) =>
        this.buildStorefrontItem(plan, index + 1, false),
      ),
    };
  }

  async findOne(id: string): Promise<SubscriptionPlan> {
    const plan = await this.plansRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException(`Plan #${id} not found`);
    return plan;
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    await this.findOne(id);
    await this.plansRepository.update(id, dto);
    return this.findOne(id);
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

  private buildStorefrontItem(
    plan: SubscriptionPlan,
    presetIndex: number,
    isFeatured: boolean,
  ): SubscriptionPlanStorefrontItemDto {
    const preset = this.storefrontPresets[presetIndex] ?? this.buildFallbackPreset(plan, presetIndex);

    return {
      id: plan.id,
      plan_name: plan.name,
      title: preset.title,
      subtitle: preset.subtitle,
      category: preset.category,
      price: Number(plan.price),
      period_label: this.resolvePeriodLabel(plan.frequency_in_days),
      badge: isFeatured ? null : preset.badge ?? null,
      featured_label: isFeatured ? preset.featured_label ?? 'FEATURED' : null,
      rating: preset.rating,
      is_featured: isFeatured,
    };
  }

  private buildFallbackPreset(
    plan: SubscriptionPlan,
    presetIndex: number,
  ): StorefrontPreset {
    const title = plan.name.endsWith('Box') ? plan.name : `${plan.name} Box`;
    const category = this.storefrontCategories[(presetIndex % (this.storefrontCategories.length - 1)) + 1];

    return {
      title,
      subtitle: `A curated ${category.toLowerCase()} subscription delivered every ${plan.frequency_in_days} days.`,
      category,
      badge: 'NEW',
      rating: Number((4.6 + Math.min(presetIndex, 3) * 0.1).toFixed(1)),
    };
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
}
