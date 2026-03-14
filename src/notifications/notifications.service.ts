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
    // Initialize Firebase Admin SDK
    if (!admin.apps.length) {
      try {
        // Check if service account file exists
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        
        if (serviceAccountPath) {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          });
          this.logger.log('Firebase Admin SDK initialized successfully');
        } else {
          this.logger.warn(
            'GOOGLE_APPLICATION_CREDENTIALS not set. Firebase notifications will not work.',
          );
        }
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin SDK', error);
      }
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
}
