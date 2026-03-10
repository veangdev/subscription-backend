import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageColumns1741670400000 implements MigrationInterface {
  name = 'AddImageColumns1741670400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      ADD COLUMN IF NOT EXISTS "image_url" text
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "profile_image_url" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "profile_image_url"
    `);

    await queryRunner.query(`
      ALTER TABLE "subscription_plans"
      DROP COLUMN IF EXISTS "image_url"
    `);
  }
}
