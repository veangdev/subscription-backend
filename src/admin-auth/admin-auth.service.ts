import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: AdminLoginDto) {
    // Find user by username
    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Verify user is admin
    if (user.role !== 'Admin') {
      throw new UnauthorizedException('Access denied: Admin role required');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async seedDefaultAdmin() {
    try {
      // Check if admin already exists by username
      let existingAdmin = await this.userRepository.findOne({
        where: { username: 'admin' },
      });

      if (existingAdmin) {
        return {
          message: 'Admin user already exists',
          user: {
            id: existingAdmin.id,
            name: existingAdmin.name,
            username: existingAdmin.username,
            email: existingAdmin.email,
            role: existingAdmin.role,
          },
        };
      }

      // Check if user exists by email but without username
      const existingByEmail = await this.userRepository.findOne({
        where: { email: 'admin@boxadmin.com' },
      });

      if (existingByEmail) {
        // Update existing user to be admin with username
        const hashedPassword = await bcrypt.hash('Admin@123', 10);
        existingByEmail.username = 'admin';
        existingByEmail.role = 'Admin';
        existingByEmail.password = hashedPassword;
        existingByEmail.name = 'System Administrator';

        const updated = await this.userRepository.save(existingByEmail);

        return {
          message: 'Existing user upgraded to admin successfully',
          credentials: {
            username: 'admin',
            password: 'Admin@123',
          },
          user: {
            id: updated.id,
            name: updated.name,
            username: updated.username,
            email: updated.email,
            role: updated.role,
          },
        };
      }

      // Create new admin user
      const hashedPassword = await bcrypt.hash('Admin@123', 10);

      const adminUser = this.userRepository.create({
        name: 'System Administrator',
        username: 'admin',
        email: 'admin@boxadmin.com',
        password: hashedPassword,
        role: 'Admin',
      });

      const saved = await this.userRepository.save(adminUser);

      return {
        message: 'Admin user created successfully',
        credentials: {
          username: 'admin',
          password: 'Admin@123',
        },
        user: {
          id: saved.id,
          name: saved.name,
          username: saved.username,
          email: saved.email,
          role: saved.role,
        },
      };
    } catch (error) {
      // Return detailed error for debugging
      return {
        message: 'Error seeding admin user',
        error: error.message,
        detail: 'This might be due to missing database column. Please ensure the latest deployment has completed.',
      };
    }
  }
}
