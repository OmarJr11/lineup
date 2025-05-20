import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
dotenv.config();

const entities: string = String(process.env.DB_ENTITIES);
const migrations: string = String(process.env.DB_MIGRATIONS);
export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username:  process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [entities],
    migrations: [migrations],
    synchronize: false,
});