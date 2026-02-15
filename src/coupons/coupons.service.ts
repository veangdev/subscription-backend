import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
  ) {}

  create(dto: CreateCouponDto): Promise<Coupon> {
    const coupon = this.couponsRepository.create(dto);
    return this.couponsRepository.save(coupon);
  }

  findAll(): Promise<Coupon[]> {
    return this.couponsRepository.find();
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponsRepository.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException(`Coupon #${id} not found`);
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    await this.findOne(id);
    await this.couponsRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.couponsRepository.delete(id);
  }
}
