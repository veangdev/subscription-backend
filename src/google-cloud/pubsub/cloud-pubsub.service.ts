import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PubSub } from '@google-cloud/pubsub';

@Injectable()
export class CloudPubSubService {
  private pubsub: PubSub;
  private readonly logger = new Logger(CloudPubSubService.name);

  constructor(private configService: ConfigService) {
    this.pubsub = new PubSub({
      projectId: this.configService.get('GOOGLE_CLOUD_PROJECT_ID'),
    });
  }

  /**
   * Publish message to topic
   */
  async publishMessage(topicName: string, data: any): Promise<string> {
    try {
      const topic = this.pubsub.topic(topicName);
      const dataBuffer = Buffer.from(JSON.stringify(data));

      const messageId = await topic.publish(dataBuffer);

      this.logger.log(`Message ${messageId} published to ${topicName}`);
      return messageId;
    } catch (error) {
      this.logger.error('Error publishing message to Pub/Sub', error);
      throw error;
    }
  }

  /**
   * Publish payment event
   */
  async publishPaymentEvent(event: {
    type: string;
    subscriptionId: number;
    amount: number;
    status: string;
  }): Promise<string> {
    return this.publishMessage('payment-events', event);
  }

  /**
   * Publish subscription event
   */
  async publishSubscriptionEvent(event: {
    type: string;
    subscriptionId: number;
    userId: number;
    planId: number;
  }): Promise<string> {
    return this.publishMessage('subscription-events', event);
  }

  /**
   * Publish shipment event
   */
  async publishShipmentEvent(event: {
    type: string;
    shipmentId: number;
    subscriptionId: number;
    trackingNumber: string;
  }): Promise<string> {
    return this.publishMessage('shipment-events', event);
  }
}
