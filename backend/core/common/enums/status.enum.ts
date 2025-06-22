import { registerEnumType } from '@nestjs/graphql';

export enum StatusEnum {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    PENDING = 'pending',
    SUSPENDED = 'suspended',
    DELETED = 'deleted',
    COMPLETED = 'completed',
    REJECTED = 'rejected',
    APPROVED = 'approved',
    FAILED = 'failed',
    DENIED = 'denied',
}

registerEnumType(StatusEnum, { name: 'StatusEnum' });