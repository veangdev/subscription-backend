import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../users/entities/user.entity';

export async function seedAdminUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
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
