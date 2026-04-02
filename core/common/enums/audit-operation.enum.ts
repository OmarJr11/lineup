import { registerEnumType } from '@nestjs/graphql';

/**
 * Type of operation recorded in audit logs.
 */
export enum AuditOperationEnum {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

registerEnumType(AuditOperationEnum, { name: 'AuditOperationEnum' });
