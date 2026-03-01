import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionPlan } from '../subscription-plans/entities/subscription-plan.entity';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly plansRepository: Repository<SubscriptionPlan>,
  ) {}

  create(dto: CreateSubscriptionDto): Promise<Subscription> {
    const subscription = this.subscriptionsRepository.create(dto);
    return this.subscriptionsRepository.save(subscription);
  }

  findAll(): Promise<Subscription[]> {
    return this.subscriptionsRepository.find({ relations: ['user', 'plan'] });
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id },
      relations: ['user', 'plan'],
    });
    if (!subscription) throw new NotFoundException(`Subscription #${id} not found`);
    return subscription;
  }

  async update(id: string, dto: UpdateSubscriptionDto): Promise<Subscription> {
    await this.findOne(id);
    await this.subscriptionsRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.subscriptionsRepository.delete(id);
  }

  async findCurrentByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({
      where: { user_id: userId, status: 'ACTIVE' },
      relations: ['user', 'plan'],
      order: { start_date: 'DESC' },
    });
  }

  async subscribeForCurrentUser(userId: string, dto: SubscribeDto): Promise<Subscription> {
    const activeSubscription = await this.findCurrentByUserId(userId);
    if (activeSubscription) {
      throw new ConflictException('User already has an active subscription');
    }

    const plan = await this.plansRepository.findOne({ where: { id: dto.plan_id } });
    if (!plan) {
      throw new NotFoundException(`Plan #${dto.plan_id} not found`);
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.frequency_in_days);

    const subscription = this.subscriptionsRepository.create({
      user_id: userId,
      plan_id: dto.plan_id,
      start_date: startDate,
      end_date: endDate,
      status: 'ACTIVE',
    });

    return this.subscriptionsRepository.save(subscription);
  }
}
