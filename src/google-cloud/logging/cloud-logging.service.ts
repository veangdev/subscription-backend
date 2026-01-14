import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logging } from '@google-cloud/logging';

@Injectable()
export class CloudLoggingService {
  private logging: Logging;
  private readonly logger = new Logger(CloudLoggingService.name);

  constructor(private configService: ConfigService) {
    this.logging = new Logging({
      projectId: this.configService.get('GOOGLE_CLOUD_PROJECT_ID'),
    });
  }

  /**
   * Log error to Cloud Logging
   */
  async logError(error: Error, context: string, metadata?: any) {
    try {
      const log = this.logging.log('subscription-errors');

      const entry = log.entry(
        {
          resource: { type: 'cloud_run_revision' },
          severity: 'ERROR',
        },
        {
          message: error.message,
          stack: error.stack,
          context,
          metadata,
          timestamp: new Date().toISOString(),
        },
      );

      await log.write(entry);
      this.logger.error(`Error logged to Cloud Logging: ${context}`);
    } catch (err) {
      this.logger.error('Failed to log to Cloud Logging', err);
    }
  }

  /**
   * Log info to Cloud Logging
   */
  async logInfo(message: string, context: string, metadata?: any) {
    try {
      const log = this.logging.log('subscription-info');

      const entry = log.entry(
        {
          resource: { type: 'cloud_run_revision' },
          severity: 'INFO',
        },
        {
          message,
          context,
          metadata,
          timestamp: new Date().toISOString(),
        },
      );

      await log.write(entry);
    } catch (err) {
      this.logger.error('Failed to log to Cloud Logging', err);
    }
  }

  /**
   * Log warning to Cloud Logging
   */
  async logWarning(message: string, context: string, metadata?: any) {
    try {
      const log = this.logging.log('subscription-warnings');

      const entry = log.entry(
        {
          resource: { type: 'cloud_run_revision' },
          severity: 'WARNING',
        },
        {
          message,
          context,
          metadata,
          timestamp: new Date().toISOString(),
        },
      );

      await log.write(entry);
    } catch (err) {
      this.logger.error('Failed to log to Cloud Logging', err);
    }
  }
}
