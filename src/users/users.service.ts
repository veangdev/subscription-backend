import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { Role } from '../access-control/entities/role.entity';
import { AccessControlService } from '../access-control/access-control.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly accessControlService: AccessControlService,
  ) {}

  async create(dto: CreateUserDto) {
    const role = await this.accessControlService.assertRoleExists(dto.role);

    await this.assertUniqueFields(dto.email, dto.username);
    this.assertAdminUsernameRequirement(role, dto.username);

    const user = this.usersRepository.create({
      name: dto.name.trim(),
      username: dto.username?.trim() || null,
      email: dto.email.trim().toLowerCase(),
      phone_number: dto.phone_number?.trim() || null,
      password: await bcrypt.hash(dto.password, 10),
      role: role.name,
      status: dto.status ?? 'Active',
    });

    const saved = await this.usersRepository.save(user);
    return this.serializeUser(saved);
  }

  async findAll(query: QueryUsersDto) {
    await this.accessControlService.ensureDefaults();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.createUsersQueryBuilder();
    this.applyUserFilters(qb, query);

    qb.orderBy('user.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await qb.getManyAndCount();

    const summaryQuery = this.createUsersQueryBuilder();
    this.applyUserFilters(summaryQuery, query, {
      includeSearch: false,
      includeStatus: false,
    });

    const rolesQuery = this.rolesRepository.createQueryBuilder('role');
    if (query.audience === 'workspace') {
      rolesQuery.andWhere('role.is_admin = :isAdmin', { isAdmin: true });
    } else if (query.audience === 'subscriber') {
      rolesQuery.andWhere('role.name = :subscriberRole', { subscriberRole: 'Subscriber' });
    }

    if (query.role?.trim()) {
      rolesQuery.andWhere('role.name = :roleName', { roleName: query.role.trim() });
    }

    const [overallTotal, activeCount, inactiveCount, roles] = await Promise.all([
      summaryQuery.getCount(),
      summaryQuery
        .clone()
        .andWhere('user.status = :activeStatus', { activeStatus: 'Active' })
        .getCount(),
      summaryQuery
        .clone()
        .andWhere('user.status = :inactiveStatus', { inactiveStatus: 'Inactive' })
        .getCount(),
      rolesQuery.orderBy('role.name', 'ASC').getMany(),
    ]);

    return {
      items: users.map((user) => this.serializeUser(user)),
      meta: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
        summary: {
          total_users: overallTotal,
          active_users: activeCount,
          inactive_users: inactiveCount,
        },
      },
      filters: {
        roles: roles.map((role) => role.name),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return this.serializeUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    let nextRoleName = user.role;
    if (dto.role?.trim()) {
      const role = await this.accessControlService.assertRoleExists(dto.role);
      nextRoleName = role.name;
      this.assertAdminUsernameRequirement(role, dto.username ?? user.username);
    } else if (dto.username !== undefined) {
      const existingRole = await this.accessControlService.assertRoleExists(user.role);
      this.assertAdminUsernameRequirement(existingRole, dto.username);
    }

    await this.assertUniqueFields(dto.email, dto.username, user.id);

    user.name = dto.name?.trim() ?? user.name;
    user.username =
      dto.username !== undefined ? dto.username?.trim() || null : user.username;
    user.email = dto.email?.trim().toLowerCase() ?? user.email;
    user.phone_number =
      dto.phone_number !== undefined ? dto.phone_number?.trim() || null : user.phone_number;
    user.role = nextRoleName;
    user.status = dto.status ?? user.status ?? 'Active';

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.usersRepository.save(user);
    return this.serializeUser(updated);
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    user.status = dto.status;
    const updated = await this.usersRepository.save(user);
    return this.serializeUser(updated);
  }

  async exportUsers(query: QueryUsersDto) {
    const list = await this.findAll({
      ...query,
      page: 1,
      limit: 1000,
    });

    const rows = [
      [
        'ID',
        'Name',
        'Username',
        'Email',
        'Phone Number',
        'Role',
        'Status',
        'Created At',
        'Updated At',
      ],
      ...list.items.map((user) => [
        user.id,
        user.name,
        user.username ?? '',
        user.email,
        user.phone_number ?? '',
        user.role,
        user.status,
        user.created_at?.toISOString?.() ?? '',
        user.updated_at?.toISOString?.() ?? '',
      ]),
    ];

    return rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');
  }

  private createUsersQueryBuilder() {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.role_details', 'roleDetails');
  }

  private applyUserFilters(
    qb: SelectQueryBuilder<User>,
    query: QueryUsersDto,
    options: {
      includeSearch?: boolean;
      includeStatus?: boolean;
    } = {},
  ) {
    const {
      includeSearch = true,
      includeStatus = true,
    } = options;

    if (query.audience === 'workspace') {
      qb.andWhere('(roleDetails.is_admin = :workspaceRole OR user.role = :legacyAdminRole)', {
        workspaceRole: true,
        legacyAdminRole: 'Admin',
      });
    } else if (query.audience === 'subscriber') {
      qb.andWhere('user.role = :subscriberRole', {
        subscriberRole: 'Subscriber',
      });
    }

    if (query.role?.trim()) {
      qb.andWhere('user.role = :role', { role: query.role.trim() });
    }

    if (includeSearch && query.search?.trim()) {
      const search = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `
          LOWER(user.name) LIKE :search
          OR LOWER(user.email) LIKE :search
          OR LOWER(COALESCE(user.phone_number, '')) LIKE :search
          OR LOWER(COALESCE(user.username, '')) LIKE :search
          OR LOWER(user.role) LIKE :search
          OR LOWER(user.status) LIKE :search
        `,
        { search },
      );
    }

    if (includeStatus && query.status?.trim()) {
      qb.andWhere('user.status = :status', { status: query.status.trim() });
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (user.username === 'admin') {
      throw new BadRequestException('The default admin account cannot be deleted');
    }

    await this.usersRepository.delete(id);
  }

  private async assertUniqueFields(email?: string, username?: string | null, excludeUserId?: string) {
    if (email?.trim()) {
      const existingByEmail = await this.usersRepository.findOne({
        where: { email: email.trim().toLowerCase() },
      });

      if (existingByEmail && existingByEmail.id !== excludeUserId) {
        throw new ConflictException('Email already registered');
      }
    }

    if (username?.trim()) {
      const existingByUsername = await this.usersRepository.findOne({
        where: { username: username.trim() },
      });

      if (existingByUsername && existingByUsername.id !== excludeUserId) {
        throw new ConflictException('Username already in use');
      }
    }
  }

  private assertAdminUsernameRequirement(role: Role, username?: string | null) {
    if (role.is_admin && !username?.trim()) {
      throw new BadRequestException('Admin-enabled roles require a username');
    }
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      status: user.status ?? 'Active',
      profile_image_url: user.profile_image_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }
}
