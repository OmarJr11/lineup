import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuditOperationEnum, AuditableEntityNameEnum } from '../common/enums';
import { EntityAuditValues } from '../common/types';
import { Business } from './business.entity';
import { User } from './user.entity';

/**
 * Generic audit entity that records changes to any auditable entity.
 * Stores who made the change, what changed (old/new values), and when.
 */
@Entity({ name: 'entity_audits' })
@Check(
    'CHK_entity_audits_creator',
    '(id_creation_business IS NOT NULL) OR (id_creation_user IS NOT NULL)',
)
export class EntityAudit {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('character varying', { name: 'entity_name', length: 100 })
    entityName: AuditableEntityNameEnum;

    @Column('int8', { name: 'entity_id' })
    entityId: number;

    @Column({
        type: 'enum',
        enum: AuditOperationEnum,
        enumName: 'entity_audits_operation_enum',
    })
    operation: AuditOperationEnum;

    @Column('jsonb', { name: 'old_values', nullable: true })
    oldValues?: EntityAuditValues;

    @Column('jsonb', { name: 'new_values', nullable: true })
    newValues?: EntityAuditValues;

    @Column('int8', { name: 'id_creation_business', nullable: true })
    idCreationBusiness?: number | null;

    @ManyToOne(() => Business, { nullable: true })
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    creationBusiness?: Business | null;

    @Column('int8', { name: 'id_creation_user', nullable: true })
    idCreationUser?: number | null;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser?: User | null;

    @Column('timestamp with time zone', { name: 'creation_date', default: () => 'CURRENT_TIMESTAMP' })
    creationDate: Date;
}
