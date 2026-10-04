import { ResponseSchema } from './response.schema';

describe('ResponseSchema', () => {
  it('creates a response class for single item', () => {
    class DummyItem {
      id: number;
    }
    const ResponseClass = ResponseSchema(DummyItem, false);
    const instance = new (ResponseClass as any)();
    expect(instance).toBeDefined();
  });

  it('creates a response class for array item', () => {
    class DummyItem {
      id: number;
    }
    const ResponseClass = ResponseSchema(DummyItem, true);
    const instance = new (ResponseClass as any)();
    expect(instance).toBeDefined();
  });
});
