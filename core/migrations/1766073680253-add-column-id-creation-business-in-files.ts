import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnIdCreationBusinessInFiles1766073680253 implements MigrationInterface {
    name = 'AddColumnIdCreationBusinessInFiles1766073680253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."files" ADD "id_creation_business" bigint`);
        await queryRunner.query(`ALTER TABLE "system"."files" DROP CONSTRAINT "FK_1f91992d190fce1d896458e2608"`);
        await queryRunner.query(`ALTER TABLE "system"."files" ALTER COLUMN "id_creation_user" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system"."files" ADD CONSTRAINT "CHK_6618ad3e05a9c779ae66fa51ea" CHECK ("id_creation_business" IS NOT NULL OR "id_creation_user" IS NOT NULL)`);
        await queryRunner.query(`ALTER TABLE "system"."files" ADD CONSTRAINT "FK_1f91992d190fce1d896458e2608" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."files" ADD CONSTRAINT "FK_67ecc04ff79fd76177a7cb794cb" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."files" DROP CONSTRAINT "FK_67ecc04ff79fd76177a7cb794cb"`);
        await queryRunner.query(`ALTER TABLE "system"."files" DROP CONSTRAINT "FK_1f91992d190fce1d896458e2608"`);
        await queryRunner.query(`ALTER TABLE "system"."files" DROP CONSTRAINT "CHK_6618ad3e05a9c779ae66fa51ea"`);
        await queryRunner.query(`ALTER TABLE "system"."files" ALTER COLUMN "id_creation_user" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system"."files" ADD CONSTRAINT "FK_1f91992d190fce1d896458e2608" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."files" DROP COLUMN "id_creation_business"`);
    }

}
