import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../access-control/entities/role.entity';
import { Permission } from '../../access-control/entities/permission.entity';
import {
  ALL_PERMISSION_KEYS,
  DEFAULT_ROLE_SEEDS,
  PERMISSION_CATALOG,
} from '../../access-control/constants/permission-catalog';

export async function seedAdminUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  await permissionRepository.upsert(
    PERMISSION_CATALOG.map((permission) => ({
      key: permission.key,
      label: permission.label,
      group_name: permission.group,
      description: permission.description,
      sort_order: permission.sort_order,
    })),
    ['key'],
  );

  const permissions = await permissionRepository.find({
    where: {
      key: In(ALL_PERMISSION_KEYS),
    },
  });
  const permissionMap = new Map(permissions.map((permission) => [permission.key, permission]));

  for (const roleSeed of DEFAULT_ROLE_SEEDS) {
    const existingRole = await roleRepository.findOne({
      where: { name: roleSeed.name },
      relations: { permissions: true },
    });

    const nextPermissions = roleSeed.permission_keys
      .map((permissionKey) => permissionMap.get(permissionKey))
      .filter((permission): permission is Permission => Boolean(permission));

    if (!existingRole) {
      const role = roleRepository.create({
        name: roleSeed.name,
        description: roleSeed.description,
        is_admin: roleSeed.is_admin,
        is_system: roleSeed.is_system,
        permissions: nextPermissions,
      });
      await roleRepository.save(role);
      continue;
    }

    existingRole.description = roleSeed.description;
    existingRole.is_admin = roleSeed.is_admin;
    existingRole.is_system = roleSeed.is_system;

    if ((existingRole.permissions?.length ?? 0) === 0 && nextPermissions.length > 0) {
      existingRole.permissions = nextPermissions;
    }

    await roleRepository.save(existingRole);
  }

  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    existingAdmin.status = existingAdmin.status ?? 'Active';
    await userRepository.save(existingAdmin);
    console.log('Admin user already exists, skipping seeder');
    return;
  }

  // Create default admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const adminUser = userRepository.create({
    name: 'System Administrator',
    username: 'admin',
    email: 'admin@boxadmin.com',
    password: hashedPassword,
    role: 'Admin',
    status: 'Active',
  });

  await userRepository.save(adminUser);

  console.log('✅ Admin user created successfully');
  console.log('   Username: admin');
  console.log('   Password: Admin@123');
  console.log('   Email: admin@boxadmin.com');
}

// Run seeder if executed directly
if (require.main === module) {
  const { AppDataSource } = require('../../config/database.config');

  AppDataSource.initialize()
    .then(async (dataSource: DataSource) => {
      await seedAdminUsers(dataSource);
      await dataSource.destroy();
    })
    .catch((error: Error) => console.error('Seeder error:', error));
}
