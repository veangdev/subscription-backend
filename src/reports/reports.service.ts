import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { User } from '../users/entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Shipment } from '../shipments/entities/shipment.entity';
import { Payment } from '../payments/entities/payment.entity';
import { SubscriptionPlan } from '../subscription-plans/entities/subscription-plan.entity';
import {
  AdminOverviewRecentActivityItemDto,
  AdminOverviewResponseDto,
  AdminOverviewStatusItemDto,
} from './dto/admin-overview-response.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Shipment)
    private readonly shipmentsRepository: Repository<Shipment>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(SubscriptionPlan)
    private readonly plansRepository: Repository<SubscriptionPlan>,
  ) {}

  create(dto: CreateReportDto): Promise<Report> {
    const report = this.reportsRepository.create(dto);
    return this.reportsRepository.save(report);
  }

  findAll(): Promise<Report[]> {
    return this.reportsRepository.find();
  }

  async getAdminOverview(): Promise<AdminOverviewResponseDto> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeSubscribers,
      activeSubscriptions,
      pendingShipments,
      planVariants,
      monthlyRevenueRaw,
      subscriptionStatuses,
      shipmentStatuses,
      paymentStatuses,
      recentSubscriptions,
      recentShipments,
      recentPayments,
      recentUsers,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({
        where: { role: 'Subscriber', status: 'Active' },
      }),
      this.subscriptionsRepository.count({
        where: { status: 'ACTIVE' },
      }),
      this.shipmentsRepository.count({
        where: { status: 'PENDING' },
      }),
      this.plansRepository.count(),
      this.paymentsRepository
        .createQueryBuilder('payment')
        .select('COALESCE(SUM(payment.amount), 0)', 'total')
        .where('payment.payment_status = :status', { status: 'SUCCESS' })
        .andWhere('payment.payment_date >= :fromDate', { fromDate: thirtyDaysAgo.toISOString() })
        .getRawOne<{ total: string }>(),
      this.aggregateStatusCounts(this.subscriptionsRepository, 'subscription', 'status'),
      this.aggregateStatusCounts(this.shipmentsRepository, 'shipment', 'status'),
      this.aggregateStatusCounts(this.paymentsRepository, 'payment', 'payment_status'),
      this.subscriptionsRepository.find({
        relations: {
          user: true,
          plan: true,
        },
        order: { start_date: 'DESC' },
        take: 4,
      }),
      this.shipmentsRepository.find({
        relations: {
          subscription: {
            user: true,
            plan: true,
          },
        },
        order: { shipment_date: 'DESC' },
        take: 4,
      }),
      this.paymentsRepository.find({
        relations: {
          subscription: {
            user: true,
            plan: true,
          },
        },
        order: { payment_date: 'DESC' },
        take: 4,
      }),
      this.usersRepository.find({
        order: { created_at: 'DESC' },
        take: 4,
      }),
    ]);

    return {
      summary: {
        total_users: totalUsers,
        active_subscribers: activeSubscribers,
        active_subscriptions: activeSubscriptions,
        pending_shipments: pendingShipments,
        plan_variants: planVariants,
        monthly_revenue: this.roundCurrency(Number(monthlyRevenueRaw?.total ?? 0)),
      },
      subscription_statuses: subscriptionStatuses,
      shipment_statuses: shipmentStatuses,
      payment_statuses: paymentStatuses,
      recent_activity: this.buildRecentActivity(
        recentSubscriptions,
        recentShipments,
        recentPayments,
        recentUsers,
      ),
    };
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({ where: { id } });
    if (!report) throw new NotFoundException(`Report #${id} not found`);
    return report;
  }

  async update(id: string, dto: UpdateReportDto): Promise<Report> {
    await this.findOne(id);
    await this.reportsRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.reportsRepository.delete(id);
  }

  private async aggregateStatusCounts<T extends { status?: string; payment_status?: string }>(
    repository: Repository<T>,
    alias: string,
    column: 'status' | 'payment_status',
  ): Promise<AdminOverviewStatusItemDto[]> {
    const rows = await repository
      .createQueryBuilder(alias)
      .select(`${alias}.${column}`, 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy(`${alias}.${column}`)
      .orderBy(`${alias}.${column}`, 'ASC')
      .getRawMany<{ status: string; count: string }>();

    return rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));
  }

  private buildRecentActivity(
    subscriptions: Subscription[],
    shipments: Shipment[],
    payments: Payment[],
    users: User[],
  ): AdminOverviewRecentActivityItemDto[] {
    const items: Array<AdminOverviewRecentActivityItemDto & { timestamp: number }> = [];

    subscriptions.forEach((subscription) => {
      const happenedAt = this.normalizeDate(subscription.start_date);
      if (!happenedAt) {
        return;
      }

      items.push({
        type: 'subscription',
        title: `${subscription.user?.name ?? 'Subscriber'} subscribed to ${subscription.plan?.name ?? 'a box'}`,
        subtitle: `Starts on ${this.formatDateOnly(happenedAt)}`,
        status: subscription.status ?? null,
        happened_at: happenedAt.toISOString(),
        timestamp: happenedAt.getTime(),
      });
    });

    shipments.forEach((shipment) => {
      const happenedAt = this.normalizeDate(shipment.shipment_date);
      if (!happenedAt) {
        return;
      }

      items.push({
        type: 'shipment',
        title: `${shipment.subscription?.plan?.name ?? 'Subscription'} shipment scheduled`,
        subtitle: `${shipment.subscription?.user?.name ?? 'Subscriber'}${shipment.tracking_number ? ` · ${shipment.tracking_number}` : ' · Tracking pending'}`,
        status: shipment.status ?? null,
        happened_at: happenedAt.toISOString(),
        timestamp: happenedAt.getTime(),
      });
    });

    payments.forEach((payment) => {
      const happenedAt = this.normalizeDate(payment.payment_date);
      if (!happenedAt) {
        return;
      }

      items.push({
        type: 'payment',
        title: `${payment.subscription?.user?.name ?? 'Subscriber'} payment ${String(payment.payment_status ?? '').toLowerCase()}`,
        subtitle: `${payment.subscription?.plan?.name ?? 'Subscription'} · $${Number(payment.amount ?? 0).toFixed(2)}`,
        status: payment.payment_status ?? null,
        happened_at: happenedAt.toISOString(),
        timestamp: happenedAt.getTime(),
      });
    });

    users.forEach((user) => {
      const happenedAt = this.normalizeDate(user.created_at);
      if (!happenedAt) {
        return;
      }

      items.push({
        type: 'user',
        title: `New ${String(user.role ?? 'user').toLowerCase()} account`,
        subtitle: `${user.name} · ${user.email}`,
        status: user.status ?? null,
        happened_at: happenedAt.toISOString(),
        timestamp: happenedAt.getTime(),
      });
    });

    return items
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 8)
      .map(({ timestamp: _timestamp, ...item }) => item);
  }

  private normalizeDate(value?: Date | string | null): Date | null {
    if (!value) {
      return null;
    }

    const normalized = new Date(value);
    return Number.isNaN(normalized.getTime()) ? null : normalized;
  }

  private formatDateOnly(value: Date): string {
    return value.toISOString().slice(0, 10);
  }

  private roundCurrency(value: number): number {
    return Number(value.toFixed(2));
  }
}
