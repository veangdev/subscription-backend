import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { AuthMeResponseDto } from './dto/auth-me-response.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedPhone = this.normalizePhoneNumber(dto.phone_number);
    const normalizedEmail = this.normalizeEmail(dto.email);

    const existingByPhone = await this.usersRepository.findOne({
      where: { phone_number: normalizedPhone },
    });
    if (existingByPhone) {
      throw new ConflictException('Phone number already registered');
    }

    if (normalizedEmail) {
      const existingByEmail = await this.usersRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (existingByEmail) {
        throw new ConflictException('Email already registered');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const storedEmail = normalizedEmail ?? this.buildPhonePlaceholderEmail(normalizedPhone);

    const user = this.usersRepository.create({
      name: dto.name.trim(),
      email: storedEmail,
      phone_number: normalizedPhone,
      password: hashedPassword,
      role: 'Subscriber',
      status: 'Active',
    });
    const saved = await this.usersRepository.save(user);

    return this.buildAuthResponse(saved);
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier?.trim() || dto.email?.trim() || '';
    if (!identifier) {
      throw new BadRequestException('Phone number or email is required');
    }

    const user = identifier.includes('@')
      ? await this.usersRepository.findOne({
          where: { email: this.normalizeEmail(identifier) ?? '' },
        })
      : await this.usersRepository.findOne({
          where: { phone_number: this.normalizePhoneNumber(identifier) },
        });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    if ((user.status ?? 'Active') !== 'Active') {
      throw new UnauthorizedException('Account is inactive');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    return this.buildAuthResponse(user);
  }

  async getCurrentUser(userId: string): Promise<AuthMeResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: this.toClientEmail(user.email),
      phone_number: user.phone_number,
      role: user.role,
      status: user.status ?? 'Active',
      created_at: user.created_at.toISOString(),
    };
  }

  private buildAuthResponse(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: this.toClientEmail(user.email),
        phone_number: user.phone_number,
        username: user.username,
        role: user.role,
        status: user.status ?? 'Active',
      },
    };
  }

  private normalizeEmail(email?: string | null): string | null {
    const normalizedEmail = email?.trim()?.toLowerCase() ?? '';
    return normalizedEmail.length > 0 ? normalizedEmail : null;
  }

  private normalizePhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      throw new BadRequestException('Phone number must contain 8 to 15 digits');
    }

    return `+${digits}`;
  }

  private buildPhonePlaceholderEmail(phoneNumber: string): string {
    const normalizedDigits = phoneNumber.replace(/\D/g, '');
    return `subscriber+${normalizedDigits}@phone.boxly.local`;
  }

  private toClientEmail(email: string | null | undefined): string | null {
    if (!email) {
      return null;
    }

    if (email.endsWith('@phone.boxly.local')) {
      return null;
    }

    return email;
  }
}
