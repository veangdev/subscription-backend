import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
  ) {}

  create(dto: CreateReportDto): Promise<Report> {
    const report = this.reportsRepository.create(dto);
    return this.reportsRepository.save(report);
  }

  findAll(): Promise<Report[]> {
    return this.reportsRepository.find();
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
}
