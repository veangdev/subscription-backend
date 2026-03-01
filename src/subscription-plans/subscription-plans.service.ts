import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

type BillingCycle = 'monthly' | 'yearly';

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
}
