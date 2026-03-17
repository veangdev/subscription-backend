import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  onModuleInit() {
    if (admin.apps.length) {
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });

      const credentialSource = process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? 'GOOGLE_APPLICATION_CREDENTIALS'
        : 'application default credentials';

      this.logger.log(
        `Firebase Admin SDK initialized successfully using ${credentialSource}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to initialize Firebase Admin SDK. Push notifications will be unavailable until Firebase credentials are configured.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Send a push notification to a user
   */
  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: {
          id: true,
          fcm_token: true,
        },
      });

      if (!user?.fcm_token) {
        this.logger.warn(
          `User ${userId} does not have an FCM token registered`,
        );
        return false;
      }

      return await this.sendNotification(user.fcm_token, title, body, data);
    } catch (error) {
      this.logger.error(
        `Failed to send notification to user ${userId}`,
        error,
      );
      return false;
    }
  }

  /**
   * Send a push notification to a specific FCM token
   */
  async sendNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!admin.apps.length) {
      this.logger.warn('Firebase Admin SDK not initialized');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token: fcmToken,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'order_notifications',
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Notification sent successfully: ${response}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send notification', error);
      
      // If token is invalid, we should clean it up
      if (error.code === 'messaging/invalid-registration-token' ||
          error.code === 'messaging/registration-token-not-registered') {
        this.logger.warn(`Invalid FCM token: ${fcmToken}. Should be cleaned up.`);
      }
      
      return false;
    }
  }

  /**
   * Send order success notification
   */
  async sendOrderSuccessNotification(
    userId: string,
    planName: string,
    amount: number,
  ): Promise<boolean> {
    return this.sendNotificationToUser(
      userId,
      '🎉 Order Successful!',
      `Your subscription to ${planName} has been confirmed! Amount: $${amount.toFixed(2)}`,
      {
        type: 'order_success',
        plan_name: planName,
        amount: amount.toString(),
      },
    );
  }

  /**
   * Send subscription renewal reminder
   */
  async sendRenewalReminderNotification(
    userId: string,
    planName: string,
    daysUntilRenewal: number,
  ): Promise<boolean> {
    return this.sendNotificationToUser(
      userId,
      '📅 Subscription Renewal Reminder',
      `Your ${planName} subscription will renew in ${daysUntilRenewal} days.`,
      {
        type: 'renewal_reminder',
        plan_name: planName,
        days_until_renewal: daysUntilRenewal.toString(),
      },
    );
  }

  /**
   * Send shipment packed notification
   */
  async sendShipmentPackedNotification(userId: string): Promise<boolean> {
    return this.sendNotificationToUser(
      userId,
      '📦 Order Being Packed',
      'Your box is being packed and will be shipped soon!',
      { type: 'shipment', status: 'PACKED' },
    );
  }

  /**
   * Send shipment notification
   */
  async sendShipmentNotification(
    userId: string,
    trackingNumber?: string,
  ): Promise<boolean> {
    const body = trackingNumber
      ? `Your order has been shipped! Tracking: ${trackingNumber}`
      : 'Your order has been shipped!';

    return this.sendNotificationToUser(
      userId,
      '📦 Order Shipped',
      body,
      {
        type: 'shipment',
        ...(trackingNumber && { tracking_number: trackingNumber }),
      },
    );
  }

  /**
   * Send shipment delivered notification
   */
  async sendShipmentDeliveredNotification(
    userId: string,
    trackingNumber?: string,
  ): Promise<boolean> {
    const body = trackingNumber
      ? `Your order has been delivered! Tracking: ${trackingNumber}`
      : 'Your order has been delivered!';

    return this.sendNotificationToUser(
      userId,
      '✅ Order Delivered',
      body,
      {
        type: 'shipment',
        status: 'DELIVERED',
        ...(trackingNumber && { tracking_number: trackingNumber }),
      },
    );
  }
}
