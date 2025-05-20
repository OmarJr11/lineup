import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username:  process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [process.env.DB_ENTITIES],
    migrations: [process.env.DB_MIGRATIONS],
    synchronize: false,
});