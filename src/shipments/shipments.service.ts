import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../addresses/entities/address.entity';
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
  ) {}

  create(dto: CreateShipmentDto): Promise<Shipment> {
    const shipment = this.shipmentsRepository.create(dto);
    return this.shipmentsRepository.save(shipment);
  }

  findAll(): Promise<Shipment[]> {
    return this.shipmentsRepository.find({ relations: ['subscription'] });
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
      relations: ['subscription'],
    });
    if (!shipment) throw new NotFoundException(`Shipment #${id} not found`);
    return shipment;
  }

  async update(id: string, dto: UpdateShipmentDto): Promise<Shipment> {
    await this.findOne(id);
    await this.shipmentsRepository.update(id, dto);
    return this.findOne(id);
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
