import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from './entities/inventory-item.entity';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepository: Repository<InventoryItem>,
  ) {}

  create(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const item = this.inventoryRepository.create(dto);
    return this.inventoryRepository.save(item);
  }

  findAll(): Promise<InventoryItem[]> {
    return this.inventoryRepository.find();
  }

  async findOne(id: string): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Inventory item #${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    await this.findOne(id);
    await this.inventoryRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.inventoryRepository.delete(id);
  }
}
