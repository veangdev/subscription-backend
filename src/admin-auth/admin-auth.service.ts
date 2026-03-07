import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRefreshDto } from './dto/admin-refresh.dto';
import { AccessControlService } from '../access-control/access-control.service';

interface AdminTokenPayload {
  sub: string;
  email: string;
  role: string;
  type?: 'access' | 'refresh';
}

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly accessControlService: AccessControlService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    // Find user by username
    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    if ((user.status ?? 'Active') !== 'Active') {
      throw new UnauthorizedException('Account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const access = await this.accessControlService.getUserAccessFromUser(user, {
      allowLegacyAdminFallback: true,
    });

    if (!access.is_admin) {
      throw new UnauthorizedException('Access denied: Admin role required');
    }

    return this.buildAuthResponse(user, access.permissions);
  }

  async refresh(dto: AdminRefreshDto) {
    let payload: AdminTokenPayload;

    try {
      payload = this.jwtService.verify<AdminTokenPayload>(dto.refresh_token, {
        secret: this.getRefreshTokenSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || (user.status ?? 'Active') !== 'Active') {
      throw new UnauthorizedException('Access denied: Admin role required');
    }

    const access = await this.accessControlService.getUserAccessFromUser(user, {
      allowLegacyAdminFallback: true,
    });

    if (!access.is_admin) {
      throw new UnauthorizedException('Access denied: Admin role required');
    }

    return this.buildAuthResponse(user, access.permissions);
  }

  async getCurrentAdmin(userId: string) {
    const access = await this.accessControlService.getUserAccessById(userId, {
      allowLegacyAdminFallback: true,
    });

    if (!access.is_admin) {
      throw new UnauthorizedException('Access denied: Admin role required');
    }

    return this.buildUserResponse(access.user, access.permissions);
  }

  async seedDefaultAdmin() {
    try {
      // Check if admin already exists by username
      let existingAdmin = await this.userRepository.findOne({
        where: { username: 'admin' },
      });

      if (existingAdmin) {
        existingAdmin.status = existingAdmin.status ?? 'Active';
        await this.userRepository.save(existingAdmin);
        return {
          message: 'Admin user already exists',
          user: this.buildUserResponse(existingAdmin),
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
        existingByEmail.status = 'Active';

        const updated = await this.userRepository.save(existingByEmail);

        return {
          message: 'Existing user upgraded to admin successfully',
          credentials: {
            username: 'admin',
            password: 'Admin@123',
          },
          user: this.buildUserResponse(updated),
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
        status: 'Active',
      });

      const saved = await this.userRepository.save(adminUser);

      return {
        message: 'Admin user created successfully',
        credentials: {
          username: 'admin',
          password: 'Admin@123',
        },
        user: this.buildUserResponse(saved),
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

  private buildAuthResponse(user: User, permissions: string[] = []) {
    const payload = this.buildAccessTokenPayload(user);

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(
        {
          ...payload,
          type: 'refresh',
        },
        {
          secret: this.getRefreshTokenSecret(),
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
        },
      ),
      user: this.buildUserResponse(user, permissions),
      permissions,
    };
  }

  private buildAccessTokenPayload(user: User): AdminTokenPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };
  }

  private buildUserResponse(
    user:
      | User
      | {
          id: string;
          name: string;
          username?: string | null;
          email: string;
          role: string;
          status?: string;
        },
    permissions: string[] = [],
  ) {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status ?? 'Active',
      permissions,
    };
  }

  private getRefreshTokenSecret() {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.getOrThrow<string>('JWT_SECRET')
    );
  }
}
