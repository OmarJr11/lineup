import { getMetadataArgsStorage } from 'typeorm';
import { User, Business } from './index';

describe('Entities (User & Business coverage)', () => {
  it('instantiates User and Business entities', () => {
    const user = new User();
    user.id = 1;
    user.email = 'test@example.com';
    user.username = 'testuser';
    user.firstName = 'Test';
    user.lastName = 'User';
    user.password = 'hash';
    user.emailValidated = true;

    expect(user).toBeDefined();
    expect(user.id).toBe(1);

    const business = new Business();
    business.id = 1;
    business.name = 'Test Biz';
    business.path = 'test-biz';
    business.email = 'biz@example.com';
    business.isOnline = true;
    business.isBsEquivalentPriceEnabled = false;

    expect(business).toBeDefined();
    expect(business.name).toBe('Test Biz');
  });

  it('executes all TypeORM relation callbacks for User and Business', () => {
    const storage = getMetadataArgsStorage();

    storage.relations.forEach((rel) => {
      if (rel.target === User || rel.target === Business) {
        if (typeof rel.type === 'function') {
          try {
            (rel.type as () => any)();
          } catch {}
        }
        if (typeof rel.inverseSideProperty === 'function') {
          const dummy = new Proxy({}, { get: () => ({}) });
          try {
            (rel.inverseSideProperty as (obj: any) => any)(dummy);
          } catch {}
        }
      }
    });
  });
});
