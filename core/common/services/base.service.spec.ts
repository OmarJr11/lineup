import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BasicService } from './base.service';
import { StatusEnum } from '../enums';

describe('BasicService', () => {
  let service: BasicService<any>;
  let repositoryMock: any;
  let requestMock: any;

  beforeEach(() => {
    repositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
      metadata: {
        columns: [
          { propertyName: 'id' },
          { propertyName: 'name' },
          { propertyName: 'disabled' },
          { propertyName: 'status' },
        ],
      },
    };

    requestMock = {
      headers: {
        'x-forwarded-for': '127.0.0.1',
        coordinate: '10.5,-66.9',
      },
      user: {
        userId: 1,
        businessId: 2,
      },
    };

    service = new BasicService(repositoryMock, requestMock);
  });

  describe('find and findByIds', () => {
    it('calls repository.find with conditions', async () => {
      repositoryMock.find.mockResolvedValue([{ id: 1 }]);
      const res = await service.find({ where: { id: 1 } });
      expect(repositoryMock.find).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(res).toEqual([{ id: 1 }]);
    });

    it('finds by ids', async () => {
      repositoryMock.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const res = await service.findByIds([1, 2], { where: {} });
      expect(repositoryMock.find).toHaveBeenCalled();
      expect(res).toHaveLength(2);
    });
  });

  describe('findOneOrFail and findByIdWithoutRelationsOrFail', () => {
    it('throws NotFoundException if id is empty', async () => {
      await expect(service.findOneOrFail(null as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('finds one entity and cleans it', async () => {
      repositoryMock.findOneOrFail.mockResolvedValue({ id: 10, name: 'Test' });
      const res = await service.findOneOrFail(10);
      expect(repositoryMock.findOneOrFail).toHaveBeenCalledWith({
        where: { id: 10 },
      });
      expect(res).toEqual({ id: 10, name: 'Test' });
    });

    it('findByIdWithoutRelationsOrFail throws ForbiddenException when not found', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('Not found'));
      await expect(
        service.findByIdWithoutRelationsOrFail(5, 'Forbidden access'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOneWithOptions and findOneWithOptionsOrFail', () => {
    it('calls findOne with options', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: 1 });
      const res = await service.findOneWithOptions({ where: { id: 1 } });
      expect(res).toEqual({ id: 1 });
    });

    it('calls findOneOrFail with options', async () => {
      repositoryMock.findOneOrFail.mockResolvedValue({ id: 1 });
      const res = await service.findOneWithOptionsOrFail({ where: { id: 1 } });
      expect(res).toEqual({ id: 1 });
    });
  });

  describe('findWithOptionsOrFail and getAll', () => {
    it('throws NotFoundException if find returns empty array', async () => {
      repositoryMock.find.mockResolvedValue([]);
      await expect(
        service.findWithOptionsOrFail({ where: { id: 1 } }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns cleaned results if found', async () => {
      repositoryMock.find.mockResolvedValue([{ id: 1, name: 'item' }]);
      const res = await service.findWithOptionsOrFail({ where: { id: 1 } });
      expect(res).toEqual([{ id: 1, name: 'item' }]);
    });

    it('getAll returns all entities', async () => {
      repositoryMock.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      const res = await service.getAll();
      expect(res).toHaveLength(2);
    });
  });

  describe('save', () => {
    it('calls repository.save and cleans internal fields', async () => {
      repositoryMock.save.mockImplementation((data: any) =>
        Promise.resolve({ id: 1, ...data }),
      );
      const dataToSave = { name: 'Item', creationUser: 5, creationIp: '127.0.0.1' };
      const saved = await service.save(dataToSave, { userId: 5 } as any);

      expect(repositoryMock.save).toHaveBeenCalled();
      expect(saved.name).toBe('Item');
      expect(saved.creationUser).toBeUndefined(); // cleanObjects deletes creationUser
    });
  });

  describe('protected helpers', () => {
    it('arrayEquals compares two arrays correctly', () => {
      expect((service as any).arrayEquals([1, 2], [2, 1])).toBe(true);
      expect((service as any).arrayEquals([1, 2], [3, 4])).toBe(false);
    });

    it('createQueryBuilder forwards to repository', () => {
      repositoryMock.createQueryBuilder.mockReturnValue({ where: jest.fn() });
      (service as any).createQueryBuilder('u');
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith('u');
    });

    it('deleteEntity removes entity via repository', async () => {
      repositoryMock.remove.mockResolvedValue({ id: 1 });
      await (service as any).deleteEntity({ id: 1 });
      expect(repositoryMock.remove).toHaveBeenCalled();
    });

    it('saveAndGetRelations saves entity and reloads relations', async () => {
      repositoryMock.save.mockResolvedValue({ id: 5 });
      repositoryMock.findOne.mockResolvedValue({ id: 5, user: { name: 'rel' } });

      const res = await service.saveAndGetRelations(
        { title: 'New' },
        { userId: 1 } as any,
        ['user'],
      );

      expect(repositoryMock.save).toHaveBeenCalled();
      expect(repositoryMock.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
        relations: ['user'],
      });
      expect(res.id).toBe(5);
    });

    it('activateEntity and activateEntityByStatus update status', async () => {
      repositoryMock.update.mockResolvedValue({ affected: 1 });
      repositoryMock.findOneOrFail.mockResolvedValue({ id: 1, name: 'Test' });

      await (service as any).activateEntity({ id: 1 }, { userId: 1 } as any);
      await (service as any).activateEntityByStatus({ id: 1 }, { userId: 1 } as any);
      expect(repositoryMock.update).toHaveBeenCalled();
    });

    it('disableEntity and disableEntityByStatus update status', async () => {
      repositoryMock.update.mockResolvedValue({ affected: 1 });
      repositoryMock.findOneOrFail.mockResolvedValue({ id: 1, name: 'Test' });

      await (service as any).disableEntity({ id: 1 }, { userId: 1 } as any);
      await (service as any).disableEntityByStatus({ id: 1 }, { userId: 1 } as any);
      expect(repositoryMock.update).toHaveBeenCalled();
    });

    it('deleteEntityByStatus marks entity as deleted', async () => {
      repositoryMock.update.mockResolvedValue({ affected: 1 });
      repositoryMock.findOneOrFail.mockResolvedValue({ id: 1, status: StatusEnum.DELETED });

      await (service as any).deleteEntityByStatus({ id: 1 }, { userId: 1 } as any);
      expect(repositoryMock.update).toHaveBeenCalled();
    });

    it('manager setter updates internal manager and connection name', () => {
      const fakeManager = {
        connection: { name: 'tenant_db' },
      };
      service.manager = fakeManager as any;
      expect((service as any)._manager).toBe(fakeManager);
      expect((service as any)._connectionName).toBe('tenant_db');
    });

    it('getPaginatedItems paginates an in-memory array', () => {
      const items = [1, 2, 3, 4, 5];
      const res = (service as any).getPaginatedItems({ page: 0, limit: 2 }, items);
      expect(res.itemCount).toBe(2);
      expect(res.totalItems).toBe(5);
      expect(res.totalPages).toBe(3);
    });

    it('getRandomAvatar selects an avatar', () => {
      const avatar = (service as any).getRandomAvatar();
      expect(typeof avatar).toBe('string');
      const avatarFiltered = (service as any).getRandomAvatar(['avatar-1']);
      expect(typeof avatarFiltered).toBe('string');
    });

    it('groupBy groups objects by key correctly', () => {
      const list = [
        { cat: 'A', val: 1 },
        { cat: 'B', val: 2 },
        { cat: 'A', val: 3 },
        { cat: null, val: 4 },
      ];
      const grouped = (service as any).groupBy(list, 'cat');
      expect(grouped['A']).toHaveLength(2);
      expect(grouped['B']).toHaveLength(1);
      expect(grouped['']).toHaveLength(1);
    });

    it('orderBy orders array correctly', async () => {
      const list = [{ v: 2 }, { v: 1 }];
      const res = await (service as any).orderBy(list, 'v', 'asc');
      expect(res[0].v).toBe(1);
    });

    it('paginate paginates an array with where filter and ordering', async () => {
      const list = [{ role: 'admin' }, { role: 'user' }, { role: 'admin' }];
      const res = await (service as any).paginate(
        { page: 1, limit: 10, order: 'DESC', orderBy: 'role', where: [{ role: 'admin' }] },
        list,
      );
      expect(res.totalItems).toBe(2);
    });

    it('updateFile updates single file and array of files', async () => {
      repositoryMock.metadata = {
        columns: [
          { propertyName: 'name' },
          { propertyName: 'modificationUser' },
          { propertyName: 'modificationDate' },
        ],
      };
      repositoryMock.update.mockResolvedValue({ affected: 1 });
      repositoryMock.findOneOrFail.mockResolvedValue({ name: 'file1.png' });
      repositoryMock.find.mockResolvedValue([{ name: 'file1.png' }, { name: 'file2.png' }]);

      const singleRes = await (service as any).updateFile(
        { note: 'test' },
        { name: 'file1.png' } as any,
        { userId: 1 },
      );
      expect(singleRes.name).toBe('file1.png');

      const arrayRes = await (service as any).updateFile(
        { note: 'test' },
        [{ name: 'file1.png' }, { name: 'file2.png' }] as any,
        { businessId: 2 },
      );
      expect(arrayRes).toHaveLength(2);
    });
  });
});
