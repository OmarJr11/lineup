import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { BusinessDec } from './business.decorator';
import { UserDec } from './user.decorator';
import { Permissions } from './permissions.decorator';
import { Response } from './response.decorator';
import { ValidateOrder } from './validate-order.decorator';
import { OrderEnum } from '../enums';

function getParamDecoratorFactory(decorator: Function) {
  class Test {
    public test(@decorator() value: any) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
  return args[Object.keys(args)[0]].factory;
}

describe('Core Decorators', () => {
  describe('BusinessDec', () => {
    const factory = getParamDecoratorFactory(BusinessDec);

    it('extracts user from HTTP request', () => {
      const mockUser = { businessId: 10, path: 'my-store' };
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => ({ user: mockUser }),
        }),
      } as any;

      expect(factory(null, ctx)).toEqual(mockUser);
    });

    it('extracts user from GraphQL context when HTTP request is not present', () => {
      const mockUser = { businessId: 20 };
      const ctx = {
        switchToHttp: () => ({
          getRequest: () => null,
        }),
        getArgByIndex: (index: number) =>
          index === 2 ? { req: { user: mockUser } } : null,
      } as any;

      expect(factory(null, ctx)).toEqual(mockUser);
    });
  });

  describe('UserDec', () => {
    const factory = getParamDecoratorFactory(UserDec);

    it('extracts user from request', () => {
      const mockUser = { userId: 5, username: 'testuser' };
      const ctx = {
        getType: () => 'http',
        getClass: () => class {},
        getHandler: () => () => {},
        getArgs: () => [null, null, { req: { user: mockUser } }, null],
        switchToHttp: () => ({
          getRequest: () => ({ user: mockUser }),
        }),
      } as any;

      expect(factory(null, ctx)).toEqual(mockUser);
    });
  });

  describe('Permissions', () => {
    it('sets permissions metadata', () => {
      class Target {}
      Permissions('READ', 'WRITE')(Target);
      const metadata = Reflect.getMetadata('permissions', Target);
      expect(metadata).toEqual(['READ', 'WRITE']);
    });
  });

  describe('Response', () => {
    it('sets response metadata', () => {
      class Target {}
      Response({ message: 'ok' })(Target);
      const metadata = Reflect.getMetadata('response', Target);
      expect(metadata).toEqual([{ message: 'ok' }]);
    });
  });

  describe('ValidateOrder', () => {
    const validator = new ValidateOrder();

    it('validates ASC, DESC, or falsy values as true', async () => {
      await expect(validator.validate(OrderEnum.ASC)).resolves.toBe(true);
      await expect(validator.validate(OrderEnum.DESC)).resolves.toBe(true);
      await expect(validator.validate('')).resolves.toBe(true);
      await expect(validator.validate(undefined as any)).resolves.toBe(true);
    });

    it('validates invalid order string as false', async () => {
      await expect(validator.validate('INVALID')).resolves.toBe(false);
    });

    it('provides default message', () => {
      expect(validator.defaultMessage()).toBe('You must send valid order');
    });
  });
});
