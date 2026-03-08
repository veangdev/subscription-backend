import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import {
  SubscriptionPlanFrequencyOptionDto,
  SubscriptionPlanStorefrontItemDto,
  SubscriptionPlanStorefrontResponseDto,
} from './dto/subscription-plan-storefront-response.dto';

type BillingCycle = 'monthly' | 'yearly';
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
          WHEN 'The Wellness Box' THEN 1
          WHEN 'Eco-Home Essentials' THEN 2
          WHEN 'Gamer''s Loot' THEN 3
          WHEN 'Snack Stash Express' THEN 4
          WHEN 'Glow Ritual Box' THEN 5
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
      period_label: this.resolvePeriodLabel(representativePlan.frequency_in_days),
      frequency_options: plans.map((plan) => this.buildFrequencyOption(plan)),
      features: preset.features,
      badge: isFeatured ? null : preset.badge ?? null,
      featured_label: isFeatured ? preset.featured_label ?? 'FEATURED' : null,
      rating: preset.rating,
      is_featured: isFeatured,
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
}
