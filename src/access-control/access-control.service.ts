import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_ROLE_SEEDS,
  PERMISSION_CATALOG,
  type PermissionSeed,
} from './constants/permission-catalog';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { User } from '../users/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRolePermissionsDto } from './dto/assign-role-permissions.dto';
import { QueryRolesDto } from './dto/query-roles.dto';

interface AccessLookupOptions {
  allowLegacyAdminFallback?: boolean;
}

@Injectable()
export class AccessControlService {
  private defaultsInitialized = false;
  private defaultsPromise: Promise<void> | null = null;

  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  getAllPermissionKeys() {
    return [...ALL_PERMISSION_KEYS];
  }

  async ensureDefaults() {
    if (this.defaultsInitialized) {
      return;
    }

    if (!this.defaultsPromise) {
      this.defaultsPromise = this.syncDefaults()
        .then(() => {
          this.defaultsInitialized = true;
        })
        .finally(() => {
          this.defaultsPromise = null;
        });
    }

    await this.defaultsPromise;
  }

  async listRoles(query: QueryRolesDto = {}) {
    await this.ensureDefaults();

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const normalizedSearch = query.search?.trim().toLowerCase();

    const filteredRolesQuery = this.rolesRepository.createQueryBuilder('role');

    if (normalizedSearch) {
      filteredRolesQuery.where(
        'LOWER(role.name) LIKE :search OR LOWER(COALESCE(role.description, \'\')) LIKE :search',
        { search: `%${normalizedSearch}%` },
      );
    }

    if (query.admin_access !== undefined) {
      filteredRolesQuery.andWhere('role.is_admin = :adminAccess', {
        adminAccess: query.admin_access,
      });
    }

    const total = await filteredRolesQuery.getCount();

    const pageRoles = await filteredRolesQuery
      .clone()
      .orderBy('role.is_system', 'DESC')
      .addOrderBy('role.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const orderedRoleIds = pageRoles.map((role) => role.id);

    const roles = orderedRoleIds.length === 0
      ? []
      : await this.rolesRepository.find({
          where: { id: In(orderedRoleIds) },
          relations: { permissions: true },
        });

    const orderedRoles = orderedRoleIds
      .map((roleId) => roles.find((role) => role.id === roleId))
      .filter((role): role is Role => Boolean(role));

    const rawCounts = orderedRoles.length === 0
      ? []
      : await this.usersRepository
          .createQueryBuilder('user')
          .select('user.role', 'role')
          .addSelect('COUNT(*)::int', 'count')
          .where('user.role IN (:...roleNames)', {
            roleNames: orderedRoles.map((role) => role.name),
          })
          .groupBy('user.role')
          .getRawMany<{ role: string; count: string }>();

    const userCountMap = new Map(rawCounts.map((row) => [row.role, Number(row.count)]));

    return {
      items: orderedRoles.map((role) => this.serializeRole(role, userCountMap.get(role.name) ?? 0)),
      meta: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findRole(id: string) {
    await this.ensureDefaults();

    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: { permissions: true },
    });

    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    const userCount = await this.usersRepository.count({
      where: { role: role.name },
    });

    return this.serializeRole(role, userCount);
  }

  async createRole(dto: CreateRoleDto) {
    await this.ensureDefaults();

    const existing = await this.rolesRepository.findOne({
      where: { name: dto.name.trim() },
    });

    if (existing) {
      throw new ConflictException(`Role "${dto.name}" already exists`);
    }

    const permissions = await this.resolvePermissionsByKeys(dto.permission_keys ?? []);

    const role = this.rolesRepository.create({
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      is_admin: dto.is_admin ?? false,
      is_system: false,
      permissions,
    });

    const saved = await this.rolesRepository.save(role);
    return this.findRole(saved.id);
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.ensureDefaults();

    return this.dataSource.transaction(async (manager) => {
      const rolesRepository = manager.getRepository(Role);
      const usersRepository = manager.getRepository(User);
      const permissionsRepository = manager.getRepository(Permission);

      const role = await rolesRepository.findOne({
        where: { id },
        relations: { permissions: true },
      });

      if (!role) {
        throw new NotFoundException(`Role #${id} not found`);
      }

      const nextName = dto.name?.trim();
      if (nextName && nextName !== role.name) {
        const existing = await rolesRepository.findOne({
          where: { name: nextName },
        });

        if (existing) {
          throw new ConflictException(`Role "${nextName}" already exists`);
        }

        await usersRepository
          .createQueryBuilder()
          .update(User)
          .set({ role: nextName })
          .where('role = :currentRole', { currentRole: role.name })
          .execute();

        role.name = nextName;
      }

      if (dto.description !== undefined) {
        role.description = dto.description?.trim() || null;
      }

      if (dto.is_admin !== undefined) {
        role.is_admin = dto.is_admin;
      }

      if (dto.permission_keys) {
        role.permissions = await this.resolvePermissionsByKeys(
          dto.permission_keys,
          permissionsRepository,
        );
      }

      const saved = await rolesRepository.save(role);

      const updated = await rolesRepository.findOne({
        where: { id: saved.id },
        relations: { permissions: true },
      });

      const userCount = await usersRepository.count({
        where: { role: saved.name },
      });

      return this.serializeRole(updated!, userCount);
    });
  }

  async removeRole(id: string) {
    await this.ensureDefaults();

    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: { permissions: true },
    });

    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    if (role.is_system) {
      throw new BadRequestException(`Role "${role.name}" is a system role and cannot be deleted`);
    }

    const assignedUsers = await this.usersRepository.count({
      where: { role: role.name },
    });

    if (assignedUsers > 0) {
      throw new BadRequestException(
        `Role "${role.name}" cannot be deleted while it is assigned to users`,
      );
    }

    await this.rolesRepository.remove(role);
  }

  async listPermissionsCatalog() {
    await this.ensureDefaults();

    const permissions = await this.permissionsRepository.find({
      order: {
        group_name: 'ASC',
        sort_order: 'ASC',
        label: 'ASC',
      },
    });

    const grouped = permissions.reduce<Record<string, ReturnType<typeof this.serializePermission>[]>>(
      (accumulator, permission) => {
        const key = permission.group_name;
        accumulator[key] ??= [];
        accumulator[key].push(this.serializePermission(permission));
        return accumulator;
      },
      {},
    );

    return {
      items: permissions.map((permission) => this.serializePermission(permission)),
      sections: Object.entries(grouped).map(([name, items]) => ({
        name,
        items,
      })),
    };
  }

  async findRolePermissions(id: string) {
    await this.ensureDefaults();

    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: { permissions: true },
    });

    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    return {
      role: this.serializeRole(role),
      assigned_permission_keys: role.permissions.map((permission) => permission.key),
      permissions: role.permissions.map((permission) => this.serializePermission(permission)),
    };
  }

  async replaceRolePermissions(id: string, dto: AssignRolePermissionsDto) {
    await this.ensureDefaults();

    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: { permissions: true },
    });

    if (!role) {
      throw new NotFoundException(`Role #${id} not found`);
    }

    role.permissions = await this.resolvePermissionsByKeys(dto.permission_keys);
    await this.rolesRepository.save(role);

    return this.findRolePermissions(id);
  }

  async assertRoleExists(roleName: string) {
    await this.ensureDefaults();

    const role = await this.rolesRepository.findOne({
      where: { name: roleName.trim() },
      relations: { permissions: true },
    });

    if (!role) {
      throw new BadRequestException(`Role "${roleName}" does not exist`);
    }

    return role;
  }

  async getUserAccessById(userId: string, options?: AccessLookupOptions) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }

    return this.getUserAccessFromUser(user, options);
  }

  async getUserAccessFromUser(user: User, options?: AccessLookupOptions) {
    try {
      await this.ensureDefaults();

      const role = await this.rolesRepository.findOne({
        where: { name: user.role },
        relations: { permissions: true },
      });

      if (!role) {
        throw new NotFoundException(`Role "${user.role}" not found`);
      }

      return {
        user: this.serializeUserAccessUser(user),
        role: this.serializeRole(role),
        is_admin: role.is_admin,
        permissions: role.permissions.map((permission) => permission.key),
      };
    } catch (error) {
      if (!options?.allowLegacyAdminFallback) {
        throw error;
      }

      const isAdmin = user.role === 'Admin';

      return {
        user: this.serializeUserAccessUser(user),
        role: null,
        is_admin: isAdmin,
        permissions: isAdmin ? this.getAllPermissionKeys() : [],
      };
    }
  }

  private async syncDefaults() {
    await this.permissionsRepository.upsert(
      PERMISSION_CATALOG.map((permission) => this.mapPermissionSeed(permission)),
      ['key'],
    );

    const permissions = await this.permissionsRepository.find({
      where: { key: In(ALL_PERMISSION_KEYS) },
    });
    const permissionMap = new Map(permissions.map((permission) => [permission.key, permission]));

    for (const definition of DEFAULT_ROLE_SEEDS) {
      const existing = await this.rolesRepository.findOne({
        where: { name: definition.name },
        relations: { permissions: true },
      });

      const nextPermissions = definition.permission_keys
        .map((permissionKey) => permissionMap.get(permissionKey))
        .filter((permission): permission is Permission => Boolean(permission));

      if (!existing) {
        const role = this.rolesRepository.create({
          name: definition.name,
          description: definition.description,
          is_admin: definition.is_admin,
          is_system: definition.is_system,
          permissions: nextPermissions,
        });
        await this.rolesRepository.save(role);
        continue;
      }

      existing.description = definition.description;
      existing.is_admin = definition.is_admin;
      existing.is_system = definition.is_system;

      if ((existing.permissions?.length ?? 0) === 0 && nextPermissions.length > 0) {
        existing.permissions = nextPermissions;
      }

      await this.rolesRepository.save(existing);
    }
  }

  private async resolvePermissionsByKeys(
    permissionKeys: string[],
    repository = this.permissionsRepository,
  ) {
    const normalizedKeys = [...new Set(permissionKeys.map((permissionKey) => permissionKey.trim()))]
      .filter(Boolean);

    if (normalizedKeys.length === 0) {
      return [];
    }

    const permissions = await repository.find({
      where: {
        key: In(normalizedKeys),
      },
    });

    const permissionMap = new Map(permissions.map((permission) => [permission.key, permission]));
    const missingKeys = normalizedKeys.filter((permissionKey) => !permissionMap.has(permissionKey));

    if (missingKeys.length > 0) {
      throw new BadRequestException(
        `Unknown permission key(s): ${missingKeys.join(', ')}`,
      );
    }

    return normalizedKeys.map((permissionKey) => permissionMap.get(permissionKey)!);
  }

  private mapPermissionSeed(permission: PermissionSeed) {
    return {
      key: permission.key,
      label: permission.label,
      group_name: permission.group,
      description: permission.description,
      sort_order: permission.sort_order,
    };
  }

  private serializePermission(permission: Permission) {
    return {
      id: permission.id,
      key: permission.key,
      label: permission.label,
      group: permission.group_name,
      description: permission.description,
      sort_order: permission.sort_order,
      created_at: permission.created_at,
      updated_at: permission.updated_at,
    };
  }

  private serializeRole(role: Role, userCount = 0) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      is_admin: role.is_admin,
      is_system: role.is_system,
      user_count: userCount,
      permission_count: role.permissions?.length ?? 0,
      permission_keys: role.permissions?.map((permission) => permission.key) ?? [],
      created_at: role.created_at,
      updated_at: role.updated_at,
    };
  }

  private serializeUserAccessUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status ?? 'Active',
    };
  }
}
