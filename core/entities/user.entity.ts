import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'users', schema: 'system' })
export class User {
    @PrimaryGeneratedColumn({ type: 'int4', name: 'id' })
    id: number;
}
