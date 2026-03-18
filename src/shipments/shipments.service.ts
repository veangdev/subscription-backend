import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryShipmentsDto } from './dto/query-shipments.dto';
import { Address } from '../addresses/entities/address.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  SubscriberShipmentAddressDto,
  SubscriberShipmentHistoryDetailDto,
  SubscriberShipmentHistoryItemDto,
} from './dto/subscriber-shipment-history-response.dto';
import { Shipment } from './entities/shipment.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentsRepository: Repository<Shipment>,
    @InjectRepository(Address)
    private readonly addressesRepository: Repository<Address>,
    private readonly notificationsService: NotificationsService,
  ) {}

  create(dto: CreateShipmentDto): Promise<Shipment> {
    const shipment = this.shipmentsRepository.create(dto);
    return this.shipmentsRepository.save(shipment);
  }

  async findAll(query: QueryShipmentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.shipmentsRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.subscription', 'subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .orderBy('shipment.shipment_date', 'DESC');

    if (query.search?.trim()) {
      const s = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `LOWER(COALESCE(user.name, '')) LIKE :s
         OR LOWER(COALESCE(user.email, '')) LIKE :s
         OR LOWER(COALESCE(plan.name, '')) LIKE :s
         OR LOWER(COALESCE(shipment.tracking_number, '')) LIKE :s
         OR LOWER(shipment.status) LIKE :s`,
        { s },
      );
    }

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();

    const [pendingCount, packedCount, shippedCount, deliveredCount] = await Promise.all([
      this.shipmentsRepository.count({ where: { status: 'PENDING' } }),
      this.shipmentsRepository.count({ where: { status: 'PACKED' } }),
      this.shipmentsRepository.count({ where: { status: 'SHIPPED' } }),
      this.shipmentsRepository.count({ where: { status: 'DELIVERED' } }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
        summary: {
          total_shipments: pendingCount + packedCount + shippedCount + deliveredCount,
          pending_count: pendingCount,
          packed_count: packedCount,
          shipped_count: shippedCount,
          delivered_count: deliveredCount,
        },
      },
    };
  }

  async findHistoryByUser(userId: string): Promise<SubscriberShipmentHistoryItemDto[]> {
    const shipments = await this.shipmentsRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.subscription', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.payments', 'payments')
      .where('subscription.user_id = :userId', { userId })
      .orderBy('shipment.shipment_date', 'DESC')
      .addOrderBy('shipment.id', 'DESC')
      .getMany();

    return shipments.map((shipment) => this.buildHistoryItem(shipment));
  }

  async findHistoryDetailByUser(
    userId: string,
    shipmentId: string,
  ): Promise<SubscriberShipmentHistoryDetailDto> {
    const shipment = await this.shipmentsRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.subscription', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.payments', 'payments')
      .leftJoinAndSelect('subscription.user', 'user')
      .where('shipment.id = :shipmentId', { shipmentId })
      .andWhere('subscription.user_id = :userId', { userId })
      .getOne();

    if (!shipment) {
      throw new NotFoundException(`Shipment #${shipmentId} not found`);
    }

    const latestAddress = await this.addressesRepository
      .createQueryBuilder('address')
      .where('address.user_id = :userId', { userId })
      .orderBy('address.created_at', 'DESC')
      .getOne();

    return this.buildHistoryDetail(shipment, latestAddress);
  }

  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentsRepository.findOne({
      where: { id },
      relations: {
        subscription: {
          user: true,
          plan: true,
        },
      },
    });
    if (!shipment) throw new NotFoundException(`Shipment #${id} not found`);
    return shipment;
  }

  async update(id: string, dto: UpdateShipmentDto): Promise<Shipment> {
    const existing = await this.findOne(id);
    await this.shipmentsRepository.update(id, dto);
    const updated = await this.findOne(id);

    if (dto.status && dto.status.toUpperCase() !== existing.status?.toUpperCase()) {
      const normalizedStatus = dto.status.toUpperCase();
      const userId = updated.subscription?.user?.id;
      if (userId) {
        if (normalizedStatus === 'PACKED') {
          await this.notificationsService.sendShipmentPackedNotification(userId);
        }
        if (normalizedStatus === 'SHIPPED') {
          await this.notificationsService.sendShipmentNotification(userId, updated.tracking_number);
        }
        if (normalizedStatus === 'DELIVERED') {
          await this.notificationsService.sendShipmentDeliveredNotification(userId, updated.tracking_number);
        }
      }
    }

    return updated;
  }

  async updateStatus(id: string, status: string): Promise<Shipment> {
    const shipment = await this.findOne(id);
    const normalizedStatus = status?.toUpperCase?.().trim();

    if (!normalizedStatus) {
      throw new BadRequestException('Status is required');
    }

    const allowed = ['PENDING', 'PACKED', 'SHIPPED', 'DELIVERED'];
    if (!allowed.includes(normalizedStatus)) {
      throw new BadRequestException(`Invalid shipment status: ${status}`);
    }

    if (shipment.status === normalizedStatus) {
      return shipment;
    }

    await this.shipmentsRepository.update(id, { status: normalizedStatus });
    const updated = await this.findOne(id);

    const userId = updated.subscription?.user?.id;
    if (userId) {
      if (normalizedStatus === 'PACKED') {
        await this.notificationsService.sendShipmentPackedNotification(userId);
      }
      if (normalizedStatus === 'SHIPPED') {
        await this.notificationsService.sendShipmentNotification(
          userId,
          updated.tracking_number,
        );
      }
      if (normalizedStatus === 'DELIVERED') {
        await this.notificationsService.sendShipmentDeliveredNotification(
          userId,
          updated.tracking_number,
        );
      }
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.shipmentsRepository.delete(id);
  }

  private buildHistoryItem(shipment: Shipment): SubscriberShipmentHistoryItemDto {
    const payment = this.pickLatestPayment(shipment);
    return {
      id: shipment.id,
      plan_name: shipment.subscription?.plan?.name ?? 'Subscription',
      shipment_date: this.formatDateOnly(shipment.shipment_date),
      status: shipment.status,
      tracking_number: shipment.tracking_number ?? null,
      amount: this.resolveAmount(shipment),
      currency: 'USD',
    };
  }

  private buildHistoryDetail(
    shipment: Shipment,
    address: Address | null,
  ): SubscriberShipmentHistoryDetailDto {
    const payment = this.pickLatestPayment(shipment);
    return {
      id: shipment.id,
      plan_name: shipment.subscription?.plan?.name ?? 'Subscription',
      shipment_date: this.formatDateOnly(shipment.shipment_date),
      status: shipment.status,
      tracking_number: shipment.tracking_number ?? null,
      amount: this.resolveAmount(shipment),
      payment_status: payment?.payment_status ?? 'SUCCESS',
      payment_date: this.formatDateTime(payment?.payment_date),
      subscription_status: shipment.subscription?.status ?? 'ACTIVE',
      subscription_start_date: this.formatDateOnly(shipment.subscription?.start_date),
      subscription_end_date: this.formatDateOnly(shipment.subscription?.end_date),
      period_label: this.resolvePeriodLabel(shipment.subscription?.plan?.frequency_in_days ?? 30),
      shipping_address: this.buildAddressSummary(shipment, address),
    };
  }

  private buildAddressSummary(
    shipment: Shipment,
    address: Address | null,
  ): SubscriberShipmentAddressDto {
    return {
      contact_name: shipment.subscription?.user?.name ?? 'Subscriber',
      phone: address?.phone ?? shipment.subscription?.user?.phone_number ?? null,
      address: address?.address ?? null,
    };
  }

  private resolveAmount(shipment: Shipment): number {
    return Number(this.pickLatestPayment(shipment)?.amount ?? shipment.subscription?.plan?.price ?? 0);
  }

  private pickLatestPayment(shipment: Shipment) {
    const payments = shipment.subscription?.payments ?? [];
    return payments.reduce((latest, payment) => {
      if (!latest) {
        return payment;
      }
      return new Date(payment.payment_date).getTime() > new Date(latest.payment_date).getTime()
        ? payment
        : latest;
    }, payments[0]);
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

  private formatDateOnly(value: Date | string): string;
  private formatDateOnly(value?: Date | string | null): string | null;
  private formatDateOnly(value?: Date | string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = new Date(value);
    return Number.isNaN(normalized.getTime()) ? null : normalized.toISOString().slice(0, 10);
  }

  private formatDateTime(value?: Date | string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = new Date(value);
    return Number.isNaN(normalized.getTime()) ? null : normalized.toISOString();
  }
}
