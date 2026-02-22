import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressesRepository: Repository<Address>,
  ) {}

  create(dto: CreateAddressDto): Promise<Address> {
    const address = this.addressesRepository.create(dto);
    return this.addressesRepository.save(address);
  }

  findAll(): Promise<Address[]> {
    return this.addressesRepository.find({ relations: ['user'] });
  }

  findByUser(userId: string): Promise<Address[]> {
    return this.addressesRepository.find({ where: { user_id: userId } });
  }

  async findOne(id: string): Promise<Address> {
    const address = await this.addressesRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!address) throw new NotFoundException(`Address #${id} not found`);
    return address;
  }

  async update(id: string, dto: UpdateAddressDto): Promise<Address> {
    await this.findOne(id);
    await this.addressesRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.addressesRepository.delete(id);
  }
}
