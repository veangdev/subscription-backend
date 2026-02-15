import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentsRepository: Repository<Shipment>,
  ) {}

  create(dto: CreateShipmentDto): Promise<Shipment> {
    const shipment = this.shipmentsRepository.create(dto);
    return this.shipmentsRepository.save(shipment);
  }

  findAll(): Promise<Shipment[]> {
    return this.shipmentsRepository.find({ relations: ['subscription'] });
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
}
