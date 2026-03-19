import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiParam } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './entities/report.entity';
import { AdminAccessGuard } from '../access-control/guards/admin-access.guard';
import { AdminOverviewResponseDto } from './dto/admin-overview-response.dto';
import { RequirePermissions } from '../access-control/decorators/permissions.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(AdminAccessGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Get admin workspace overview metrics' })
  @ApiOkResponse({
    description: 'Summary metrics, status breakdowns, and recent activity for the admin dashboard',
    type: AdminOverviewResponseDto,
  })
  getOverview(): Promise<AdminOverviewResponseDto> {
    return this.reportsService.getAdminOverview();
  }

  @Post()
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Create a new report' })
  @ApiCreatedResponse({ description: 'Report created successfully', type: Report })
  create(@Body() dto: CreateReportDto): Promise<Report> {
    return this.reportsService.create(dto);
  }

  @Get()
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Get all reports' })
  @ApiOkResponse({ description: 'List of all reports', type: [Report] })
  findAll(): Promise<Report[]> {
    return this.reportsService.findAll();
  }

  @Get(':id')
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Get a report by ID' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Report found', type: Report })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Report> {
    return this.reportsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Update a report' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiOkResponse({ description: 'Report updated', type: Report })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReportDto): Promise<Report> {
    return this.reportsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Delete a report' })
  @ApiParam({ name: 'id', example: '550e8400-e29b-41d4-a716-446655440000' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.reportsService.remove(id);
  }
}
