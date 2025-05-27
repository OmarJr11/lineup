import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123',
  database: process.env.DB_NAME || 'lineup',
  entities: [process.env.DB_ENTITIES || 'core/entities/*.entity.ts'],
  migrations: [process.env.DB_MIGRATIONS || 'core/migrations/*.ts'],
  synchronize: true,
  logging: false,
});
