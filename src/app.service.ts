import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly startedAt = new Date();

  getApiInfo() {
    return {
      name: 'Subscription Box API',
      version: '1.0.0',
      description: 'API for Subscription Box Management System',
      docs: '/api/docs',
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
      },
    };
  }

  getHealth() {
    const now = new Date();
    const uptimeMs = now.getTime() - this.startedAt.getTime();

    return {
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
      uptime: this.formatUptime(uptimeMs),
      timestamp: now.toISOString(),
    };
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / (1000 * 60)) % 60;
    const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }
}
