import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntityStates1772993609657 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "system"."states_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`,
    );
    await queryRunner.query(
      `CREATE TABLE "system"."states" (
                "creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(),
                "creation_ip" character varying(50),
                "modification_ip" character varying(50),
                "creation_coordinate" point,
                "modification_coordinate" point,
                "id" BIGSERIAL NOT NULL,
                "name" character varying(100) NOT NULL,
                "code" character varying(10),
                "capital" character varying(100),
                "status" "system"."states_status_enum" NOT NULL DEFAULT 'active',
                "id_creation_user" bigint NOT NULL,
                "id_modification_user" bigint,
                CONSTRAINT "PK_states_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_states_name" UNIQUE ("name"),
                CONSTRAINT "UQ_states_code" UNIQUE ("code"),
                CONSTRAINT "UQ_states_capital" UNIQUE ("capital")
            )`,
    );
    await queryRunner.query(
      `ALTER TABLE "system"."states" ADD CONSTRAINT "FK_states_id_creation_user" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "system"."states" ADD CONSTRAINT "FK_states_id_modification_user" FOREIGN KEY ("id_modification_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
            INSERT INTO system.states (name, code, capital, id_creation_user)
            VALUES
                ('Amazonas', 'VE-Z', 'Puerto Ayacucho', 1),
                ('Anzoátegui', 'VE-B', 'Barcelona', 1),
                ('Apure', 'VE-C', 'San Fernando de Apure', 1),
                ('Aragua', 'VE-D', 'Maracay', 1),
                ('Barinas', 'VE-E', 'Barinas', 1),
                ('Bolívar', 'VE-F', 'Ciudad Bolívar', 1),
                ('Carabobo', 'VE-G', 'Valencia', 1),
                ('Cojedes', 'VE-H', 'San Carlos', 1),
                ('Delta Amacuro', 'VE-Y', 'Tucupita', 1),
                ('Dependencias Federales', 'VE-W', NULL, 1),
                ('Distrito Capital', 'VE-A', 'Caracas', 1),
                ('Falcón', 'VE-I', 'Coro', 1),
                ('Guárico', 'VE-J', 'San Juan de los Morros', 1),
                ('La Guaira', 'VE-X', 'La Guaira', 1),
                ('Lara', 'VE-K', 'Barquisimeto', 1),
                ('Mérida', 'VE-L', 'Mérida', 1),
                ('Miranda', 'VE-M', 'Los Teques', 1),
                ('Monagas', 'VE-N', 'Maturín', 1),
                ('Nueva Esparta', 'VE-O', 'La Asunción', 1),
                ('Portuguesa', 'VE-P', 'Guanare', 1),
                ('Sucre', 'VE-R', 'Cumaná', 1),
                ('Táchira', 'VE-S', 'San Cristóbal', 1),
                ('Trujillo', 'VE-T', 'Trujillo', 1),
                ('Yaracuy', 'VE-U', 'San Felipe', 1),
                ('Zulia', 'VE-V', 'Maracaibo', 1)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system"."states" DROP CONSTRAINT "FK_states_id_modification_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system"."states" DROP CONSTRAINT "FK_states_id_creation_user"`,
    );
    await queryRunner.query(`DROP TABLE "system"."states"`);
    await queryRunner.query(`DROP TYPE "system"."states_status_enum"`);
  }
}
