import { LazyMetadataStorage } from '@nestjs/graphql/dist/schema-builder/storages/lazy-metadata.storage';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProductSkuInput } from './update-product-sku.input';
import { InitialStockItemInput } from './initial-stock-item.input';

describe('Product SKU Inputs', () => {
  beforeAll(() => {
    const map: Map<any, any[]> = (LazyMetadataStorage as any).lazyMetadataByTarget;
    if (map) {
      map.forEach((fns) => {
        fns?.forEach((fn) => {
          try {
            fn();
          } catch {}
        });
      });
    }
  });




  describe('UpdateProductSkuInput', () => {
    it('validates valid input successfully', async () => {
      const input = plainToInstance(UpdateProductSkuInput, {
        id: 1,
        quantity: 10,
        price: 99.99,
        idCurrency: 2,
        skuCode: 'SKU-123',
      });

      const errors = await validate(input);
      expect(errors.length).toBe(0);
      expect(input.id).toBe(1);
      expect(input.quantity).toBe(10);
    });

    it('fails when price is provided without idCurrency', async () => {
      const input = plainToInstance(UpdateProductSkuInput, {
        id: 1,
        price: 99.99,
      });

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('InitialStockItemInput', () => {
    it('validates simple initial stock successfully', async () => {
      const input = plainToInstance(InitialStockItemInput, {
        quantityDelta: 50,
        notes: 'Initial batch',
      });

      const errors = await validate(input);
      expect(errors.length).toBe(0);
      expect(input.quantityDelta).toBe(50);
    });

    it('validates stock with variation options', async () => {
      const input = plainToInstance(InitialStockItemInput, {
        quantityDelta: 25,
        variationOptions: [{ variationTitle: 'Size', option: 'Large' }],
      });

      const errors = await validate(input);
      expect(errors.length).toBe(0);
      expect(input.variationOptions?.[0].variationTitle).toBe('Size');
    });
  });
});
