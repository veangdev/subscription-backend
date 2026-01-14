import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudStorageService } from './storage/cloud-storage.service';
import { CloudLoggingService } from './logging/cloud-logging.service';
import { CloudPubSubService } from './pubsub/cloud-pubsub.service';

@Module({
  imports: [ConfigModule],
  providers: [CloudStorageService, CloudLoggingService, CloudPubSubService],
  exports: [CloudStorageService, CloudLoggingService, CloudPubSubService],
})
export class GoogleCloudModule {}
