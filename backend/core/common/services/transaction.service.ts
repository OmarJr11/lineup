import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class TransactionService {
    constructor(private readonly dataSource: DataSource) {}

    /**
     * Ejecuta una función dentro de una transacción, manejando commit/rollback/release automáticamente.
     * @param fn Función async que recibe el queryRunner.manager y retorna el resultado deseado
     */
    async executeInTransaction<T>(fn: (manager: QueryRunner['manager']) => Promise<T>): Promise<T> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const result = await fn(queryRunner.manager);
            await queryRunner.commitTransaction();
            return result;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }
}
