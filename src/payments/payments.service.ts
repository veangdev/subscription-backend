import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
  ) {}

  create(dto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentsRepository.create(dto);
    return this.paymentsRepository.save(payment);
  }

  async findAll(query: QueryPaymentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.subscription', 'subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .orderBy('payment.payment_date', 'DESC');

    if (query.search?.trim()) {
      const s = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `LOWER(COALESCE(user.name, '')) LIKE :s
         OR LOWER(COALESCE(user.email, '')) LIKE :s
         OR LOWER(COALESCE(plan.name, '')) LIKE :s
         OR LOWER(payment.payment_status) LIKE :s`,
        { s },
      );
    }

    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();

    const [successCount, pendingCount, failedCount, volumeResult] = await Promise.all([
      this.paymentsRepository.count({ where: { payment_status: 'SUCCESS' } }),
      this.paymentsRepository.count({ where: { payment_status: 'PENDING' } }),
      this.paymentsRepository.count({ where: { payment_status: 'FAILED' } }),
      this.paymentsRepository
        .createQueryBuilder('p')
        .select('COALESCE(SUM(CAST(p.amount AS DECIMAL)), 0)', 'total')
        .getRawOne<{ total: string }>(),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
        summary: {
          total_payments: successCount + pendingCount + failedCount,
          success_count: successCount,
          pending_count: pendingCount,
          failed_count: failedCount,
          total_volume: parseFloat(volumeResult?.total ?? '0'),
        },
      },
    };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id },
      relations: {
        subscription: {
          user: true,
          plan: true,
        },
      },
    });
    if (!payment) throw new NotFoundException(`Payment #${id} not found`);
    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto): Promise<Payment> {
    await this.findOne(id);
    await this.paymentsRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.paymentsRepository.delete(id);
  }
}
