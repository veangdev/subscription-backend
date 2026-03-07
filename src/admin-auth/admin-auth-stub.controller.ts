import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthStubController {
  @Post('login')
  @ApiOperation({ summary: 'Admin login - CURRENTLY UNAVAILABLE' })
  async login(@Body() body: any) {
    throw new HttpException(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database connection required but not available',
        error: 'Service Unavailable',
        details: {
          issue: 'Cloud SQL instance "subscription-db" is not accessible',
          fix: 'Run setup script or create Cloud SQL instance',
          dbTest: 'Check /api/db-test for connection details',
          received: body,
        },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  @Post('register')
  @ApiOperation({ summary: 'Admin registration - CURRENTLY UNAVAILABLE' })
  async register(@Body() body: any) {
    throw new HttpException(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Database connection required but not available',
        error: 'Service Unavailable',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export default AdminAuthStubController;
