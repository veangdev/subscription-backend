import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFcmToken1741900000000 implements MigrationInterface {
  name = 'AddFcmToken1741900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "fcm_token" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "fcm_token"
    `);
  }
}
