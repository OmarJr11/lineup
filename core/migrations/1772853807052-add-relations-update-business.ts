import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationsUpdateBusiness1772853807052
  implements MigrationInterface
{
  name = 'AddRelationsUpdateBusiness1772853807052';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD "modification_business" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD CONSTRAINT "FK_71f7c83e0916bd985deff96c6cd" FOREIGN KEY ("modification_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP CONSTRAINT "FK_71f7c83e0916bd985deff96c6cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP COLUMN "modification_business"`,
    );
  }
}
