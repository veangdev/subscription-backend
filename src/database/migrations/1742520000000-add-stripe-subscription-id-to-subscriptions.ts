import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStripeSubscriptionIdToSubscriptions1742520000000
  implements MigrationInterface
{
  name = 'AddStripeSubscriptionIdToSubscriptions1742520000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      ADD COLUMN IF NOT EXISTS "stripe_subscription_id" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscriptions"
      DROP COLUMN IF EXISTS "stripe_subscription_id"
    `);
  }
}
