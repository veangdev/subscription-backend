import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductsTable1742000000000 implements MigrationInterface {
  name = 'AddProductsTable1742000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(150) NOT NULL,
        "description" text,
        "category" character varying(100),
        "price" numeric(10,2) NOT NULL,
        "image_url" text,
        "sku" character varying(100),
        "weight_kg" numeric(8,3),
        "dimensions" character varying(50),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscription_plan_products" (
        "plan_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        CONSTRAINT "PK_subscription_plan_products" PRIMARY KEY ("plan_id", "product_id"),
        CONSTRAINT "FK_spp_plan" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_spp_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_plan_products"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
  }
}
