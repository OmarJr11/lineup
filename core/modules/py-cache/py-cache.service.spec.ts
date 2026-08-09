jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

import { createClient } from 'redis';
import { PyCacheService } from './py-cache.service';

/**
 * Unit tests for {@link PyCacheService}.
 */
describe('PyCacheService', () => {
  const mockClient = {
    connect: jest.fn(),
    disconnect: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(1),
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn(),
    scanIterator: jest.fn(),
    sendCommand: jest.fn(),
  };
  let service: PyCacheService;
  const createClientMock = createClient as jest.MockedFunction<typeof createClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.connect.mockResolvedValue(mockClient as never);
    createClientMock.mockReturnValue(mockClient as never);
    service = new PyCacheService();
  });

  describe('setCache', () => {
    it('deletes key then sets value without TTL when ttl omitted', async () => {
      await service.setCache('k1', { a: 1 });
      expect(mockClient.del).toHaveBeenCalledWith('k1');
      expect(mockClient.set).toHaveBeenCalledWith('k1', JSON.stringify({ a: 1 }));
    });
    it('sets value with EX when ttlSeconds is positive', async () => {
      await service.setCache('k2', { b: 2 }, 60);
      expect(mockClient.set).toHaveBeenCalledWith('k2', JSON.stringify({ b: 2 }), {
        EX: 60,
      });
    });
  });

  describe('getCache', () => {
    it('returns null when key is missing', async () => {
      mockClient.get.mockResolvedValue(null);
      await expect(service.getCache('missing')).resolves.toBeNull();
    });
    it('returns parsed object when value exists', async () => {
      mockClient.get.mockResolvedValue('{"x":1}');
      await expect(service.getCache('k')).resolves.toEqual({ x: 1 });
    });
  });

  describe('deleteCache', () => {
    it('calls del on the key', async () => {
      await service.deleteCache('to-delete');
      expect(mockClient.del).toHaveBeenCalledWith('to-delete');
    });
  });

  describe('deleteKeysByPrefix', () => {
    it('collects keys from scan and sends DEL', async () => {
      async function* scanGen(): AsyncIterable<string> {
        yield 'pre:a';
        yield 'pre:b';
      }
      mockClient.scanIterator.mockReturnValue(scanGen());
      mockClient.sendCommand.mockResolvedValue(2);
      const deleted = await service.deleteKeysByPrefix('pre:');
      expect(deleted).toEqual(['pre:a', 'pre:b']);
      expect(mockClient.sendCommand).toHaveBeenCalledWith(['DEL', 'pre:a', 'pre:b']);
    });
  });

  describe('deleteIdleKeys', () => {
    it('returns 0 when no idle keys are found', async () => {
      async function* emptyScan(): AsyncIterable<string> {
        yield* [];
      }
      mockClient.scanIterator.mockReturnValue(emptyScan());
      await expect(service.deleteIdleKeys()).resolves.toBe(0);
    });
  });
});
