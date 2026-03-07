import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

@ApiTags('Health')
@Public()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'API information and available endpoints' })
  @ApiOkResponse({ description: 'API info with links to docs and auth' })
  getApiInfo() {
    return this.appService.getApiInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check with uptime and environment' })
  @ApiOkResponse({ description: 'Service health status' })
  health() {
    return this.appService.getHealth();
  }

  @Get('db-test')
  @ApiOperation({ summary: 'Test database connectivity' })
  async testDatabase() {
    const startTime = Date.now();
    const host = this.configService.get('DATABASE_HOST');
    const user = this.configService.get('DATABASE_USER');
    const database = this.configService.get('DATABASE_NAME');
    const isUnixSocket = host?.startsWith('/');
    
    const client = new Client({
      host: isUnixSocket ? host : undefined,
      port: isUnixSocket ? undefined : Number(this.configService.get('DATABASE_PORT', 5432)),
      user,
      password: this.configService.get('DATABASE_PASSWORD'),
      database,
      connectionTimeoutMillis: 2000,
    });

    try {
      await client.connect();
      const result = await client.query('SELECT NOW() as now, version() as version');
      await client.end();
      
      return {
        success: true,
        duration: Date.now() - startTime,
        connection: { host: isUnixSocket ? host : `${host}:${this.configService.get('DATABASE_PORT')}`, database },
        result: result.rows[0],
      };
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        connection: { host: isUnixSocket ? host : `${host}:${this.configService.get('DATABASE_PORT')}`, database },
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3),
      };
    }
  }
}
