import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdAsPrimaryKey1772854586670 implements MigrationInterface {
  name = 'AddIdAsPrimaryKey1772854586670';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD "id" BIGSERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP CONSTRAINT "PK_e3767dd3a7d1b26f69fc5e590f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD CONSTRAINT "PK_083f2c2047a9b049c0d92a9f09a" PRIMARY KEY ("id_product", "id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP CONSTRAINT "FK_e3767dd3a7d1b26f69fc5e590f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP CONSTRAINT "PK_083f2c2047a9b049c0d92a9f09a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD CONSTRAINT "PK_c1c9c77ff87b66b7ac5cb3f15e6" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD CONSTRAINT "UQ_e3767dd3a7d1b26f69fc5e590f8" UNIQUE ("id_product")`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD CONSTRAINT "FK_e3767dd3a7d1b26f69fc5e590f8" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP CONSTRAINT "FK_e3767dd3a7d1b26f69fc5e590f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP CONSTRAINT "UQ_e3767dd3a7d1b26f69fc5e590f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP CONSTRAINT "PK_c1c9c77ff87b66b7ac5cb3f15e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD CONSTRAINT "PK_083f2c2047a9b049c0d92a9f09a" PRIMARY KEY ("id_product", "id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD CONSTRAINT "FK_e3767dd3a7d1b26f69fc5e590f8" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP CONSTRAINT "PK_083f2c2047a9b049c0d92a9f09a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD CONSTRAINT "PK_e3767dd3a7d1b26f69fc5e590f8" PRIMARY KEY ("id_product")`,
    );
    await queryRunner.query(`ALTER TABLE "discount_products" DROP COLUMN "id"`);
  }
}
