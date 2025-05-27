import { Injectable, Inject } from '@nestjs/common';
import { TransactionService } from './transaction.service';

export function MyTransactional(): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      // Busca TransactionService en la instancia actual
      const transactionService: TransactionService = this.transactionService;
      if (!transactionService) {
        throw new Error('TransactionService must be injected in the class to use @MyTransactional');
      }
      return transactionService.executeInTransaction(async (manager) => {
        // Inyecta el manager si el método lo espera como último argumento
        const methodArgs = originalMethod.length === args.length + 1 ? [...args, manager] : args;
        return originalMethod.apply(this, methodArgs);
      });
    };
    return descriptor;
  };
}
