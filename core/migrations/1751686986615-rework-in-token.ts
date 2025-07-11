import { MigrationInterface, QueryRunner } from "typeorm";

export class ReworkInToken1751686986615 implements MigrationInterface {
    name = 'ReworkInToken1751686986615'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Agregar columna id
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD "id" BIGSERIAL NOT NULL`);
        // 2. Eliminar PK actual ("id_user", "token")
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP CONSTRAINT "PK_f605be7e1b82d9306600489d65c"`);
        // 3. Crear PK temporal ("id_user", "token", "id")
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD CONSTRAINT "PK_f2d0e572fcf8d8fb43828f94d4c" PRIMARY KEY ("id_user", "token", "id")`);
        // 4. Agregar columna id_business
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD "id_business" bigint`);
        // 5. Eliminar FK de id_user (si existe)
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP CONSTRAINT IF EXISTS "FK_39ec4c99950a8c64e84d4e96399"`);
        // 6. Eliminar PK temporal ("id_user", "token", "id")
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP CONSTRAINT "PK_f2d0e572fcf8d8fb43828f94d4c"`);
        // 7. Crear PK temporal ("token", "id")
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD CONSTRAINT "PK_6952cf59a69eeafbdc3cb3b18d9" PRIMARY KEY ("token", "id")`);
        // 8. Eliminar PK temporal ("token", "id")
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP CONSTRAINT "PK_6952cf59a69eeafbdc3cb3b18d9"`);
        // 9. Crear PK final ("id")
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id")`);
        // 10. Ahora sí, hacer id_user nullable
        await queryRunner.query(`ALTER TABLE "system"."tokens" ALTER COLUMN "id_user" DROP NOT NULL`);
        // 11. Agregar FK de id_user
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD CONSTRAINT "FK_39ec4c99950a8c64e84d4e96399" FOREIGN KEY ("id_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // 12. Agregar FK de id_business
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD CONSTRAINT "FK_53d9fec20e3bf4f3b9580eafcf6" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Eliminar FK de id_business
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP CONSTRAINT "FK_53d9fec20e3bf4f3b9580eafcf6"`);
        // 2. Eliminar FK de id_user
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP CONSTRAINT "FK_39ec4c99950a8c64e84d4e96399"`);
        // 3. Eliminar PK actual ("id")
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP CONSTRAINT "PK_3001e89ada36263dabf1fb6210a"`);
        // 4. Crear PK temporal ("token", "id")
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD CONSTRAINT "PK_6952cf59a69eeafbdc3cb3b18d9" PRIMARY KEY ("token", "id")`);
        // 5. Eliminar PK temporal ("token", "id")
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP CONSTRAINT "PK_6952cf59a69eeafbdc3cb3b18d9"`);
        // 6. Crear PK temporal ("id_user", "token", "id")
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD CONSTRAINT "PK_f2d0e572fcf8d8fb43828f94d4c" PRIMARY KEY ("id_user", "token", "id")`);
        // 7. Hacer id_user NOT NULL
        await queryRunner.query(`ALTER TABLE "system"."tokens" ALTER COLUMN "id_user" SET NOT NULL`);
        // 8. Agregar FK de id_user
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD CONSTRAINT "FK_39ec4c99950a8c64e84d4e96399" FOREIGN KEY ("id_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // 9. Eliminar columna id_business
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP COLUMN "id_business"`);
        // 10. Eliminar PK temporal ("id_user", "token", "id")
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP CONSTRAINT "PK_f2d0e572fcf8d8fb43828f94d4c"`);
        // 11. Crear PK original ("id_user", "token")
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD CONSTRAINT "PK_f605be7e1b82d9306600489d65c" PRIMARY KEY ("id_user", "token")`);
        // 12. Eliminar columna id
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP COLUMN "id"`);
    }
}