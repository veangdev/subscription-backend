import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionPlan } from '../subscription-plans/entities/subscription-plan.entity';
import { SubscribeDto } from './dto/subscribe.dto';
import { Shipment } from '../shipments/entities/shipment.entity';
import {
  DashboardShipmentStepDto,
  DashboardShipmentSummaryDto,
  DashboardSubscriptionSummaryDto,
  DashboardBillingSummaryDto,
  SubscriberDashboardResponseDto,
} from './dto/subscriber-dashboard-response.dto';
import { Payment } from '../payments/entities/payment.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly plansRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Shipment)
    private readonly shipmentsRepository: Repository<Shipment>,
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

    const savedSubscription = await this.subscriptionsRepository.save(subscription);
    await this.ensureInitialShipments([savedSubscription]);
    return savedSubscription;
  }

  async buildDashboardForUser(userId: string): Promise<SubscriberDashboardResponseDto> {
    const activeSubscriptions = await this.subscriptionsRepository.find({
      where: {
        user_id: userId,
        status: In(['ACTIVE', 'PAUSED']),
      },
      relations: ['plan', 'payments'],
      order: { end_date: 'ASC' },
    });

    await this.ensureInitialShipments(activeSubscriptions);

    const latestShipment = await this.shipmentsRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.subscription', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.user_id = :userId', { userId })
      .andWhere('subscription.status IN (:...statuses)', {
        statuses: ['ACTIVE', 'PAUSED'],
      })
      .orderBy('shipment.shipment_date', 'DESC')
      .addOrderBy('shipment.id', 'DESC')
      .getOne();

    return {
      billing: this.buildBillingSummary(activeSubscriptions),
      latest_shipment: latestShipment
        ? this.buildShipmentSummary(latestShipment)
        : null,
      active_subscriptions: activeSubscriptions.map((subscription) =>
        this.buildSubscriptionSummary(subscription),
      ),
    };
  }

  private buildBillingSummary(
    subscriptions: Subscription[],
  ): DashboardBillingSummaryDto {
    const nextBillingDate = subscriptions.find((subscription) => subscription.end_date)?.end_date;

    return {
      next_billing_date: this.formatDateOnly(nextBillingDate),
      total_amount: this.roundCurrency(
        subscriptions.reduce(
          (sum, subscription) => sum + Number(subscription.plan?.price ?? 0),
          0,
        ),
      ),
      currency: 'USD',
      subscription_count: subscriptions.length,
    };
  }

  private buildSubscriptionSummary(
    subscription: Subscription,
  ): DashboardSubscriptionSummaryDto {
    return {
      id: subscription.id,
      plan_id: subscription.plan_id,
      name: subscription.plan?.name ?? 'Subscription',
      status: subscription.status,
      recharge_date: this.formatDateOnly(subscription.end_date),
      price: this.roundCurrency(Number(subscription.plan?.price ?? 0)),
      frequency_in_days: subscription.plan?.frequency_in_days ?? 0,
      billing_status: this.resolveBillingStatus(subscription.payments ?? []),
    };
  }

  private buildShipmentSummary(shipment: Shipment): DashboardShipmentSummaryDto {
    const currentStep = this.mapShipmentStatusToStep(shipment.status);
    const steps = this.buildShipmentSteps(currentStep);
    const estimatedDeliveryDate = this.buildEstimatedDeliveryDate(
      shipment.shipment_date,
      shipment.status,
    );

    return {
      id: shipment.id,
      subscription_id: shipment.subscription_id,
      subscription_name: shipment.subscription?.plan?.name ?? 'Subscription',
      status: shipment.status,
      shipment_date: this.formatDateOnly(shipment.shipment_date) ?? '',
      estimated_delivery_date: this.formatDateOnly(estimatedDeliveryDate),
      tracking_number: shipment.tracking_number ?? null,
      progress: this.calculateShipmentProgress(currentStep),
      steps,
    };
  }

  private resolveBillingStatus(payments: Payment[]): string {
    if (payments.length === 0) {
      return 'PENDING';
    }

    const latestPayment = [...payments].sort(
      (left, right) =>
        new Date(right.payment_date).getTime() - new Date(left.payment_date).getTime(),
    )[0];

    switch (latestPayment?.payment_status?.toUpperCase()) {
      case 'SUCCESS':
        return 'PAID';
      case 'FAILED':
        return 'FAILED';
      case 'PENDING':
        return 'PENDING';
      default:
        return 'PENDING';
    }
  }

  private mapShipmentStatusToStep(status: string): 'PACKED' | 'SHIPPED' | 'DELIVERED' {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'DELIVERED';
      case 'SHIPPED':
        return 'SHIPPED';
      default:
        return 'PACKED';
    }
  }

  private buildShipmentSteps(
    currentStep: 'PACKED' | 'SHIPPED' | 'DELIVERED',
  ): DashboardShipmentStepDto[] {
    const orderedSteps = [
      { key: 'PACKED', label: 'Packed' },
      { key: 'SHIPPED', label: 'Shipped' },
      { key: 'DELIVERED', label: 'Delivered' },
    ] as const;
    const currentIndex = orderedSteps.findIndex((step) => step.key === currentStep);

    return orderedSteps.map((step, index) => ({
      key: step.key,
      label: step.label,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  }

  private calculateShipmentProgress(currentStep: 'PACKED' | 'SHIPPED' | 'DELIVERED'): number {
    switch (currentStep) {
      case 'DELIVERED':
        return 1;
      case 'SHIPPED':
        return 0.5;
      default:
        return 0;
    }
  }

  private buildEstimatedDeliveryDate(
    shipmentDate: Date,
    status: string,
  ): Date {
    const baseDate = new Date(shipmentDate);

    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return baseDate;
      case 'SHIPPED':
        baseDate.setDate(baseDate.getDate() + 3);
        return baseDate;
      default:
        baseDate.setDate(baseDate.getDate() + 7);
        return baseDate;
    }
  }

  private async ensureInitialShipments(subscriptions: Subscription[]): Promise<void> {
    const activeSubscriptions = subscriptions.filter(
      (subscription) => subscription.status?.toUpperCase() === 'ACTIVE',
    );

    if (activeSubscriptions.length === 0) {
      return;
    }

    const existingShipments = await this.shipmentsRepository.find({
      where: {
        subscription_id: In(activeSubscriptions.map((subscription) => subscription.id)),
      },
      select: ['subscription_id'],
    });

    const existingShipmentSubscriptionIds = new Set(
      existingShipments.map((shipment) => shipment.subscription_id),
    );

    const initialShipments = activeSubscriptions
      .filter((subscription) => !existingShipmentSubscriptionIds.has(subscription.id))
      .map((subscription) =>
        this.shipmentsRepository.create({
          subscription_id: subscription.id,
          shipment_date: subscription.start_date ?? new Date(),
          status: 'PENDING',
        }),
      );

    if (initialShipments.length === 0) {
      return;
    }

    await this.shipmentsRepository.save(initialShipments);
  }

  private formatDateOnly(value: Date | null | undefined): string | null {
    if (!value) {
      return null;
    }

    return new Date(value).toISOString().slice(0, 10);
  }

  private roundCurrency(value: number): number {
    return Number(value.toFixed(2));
  }
}
