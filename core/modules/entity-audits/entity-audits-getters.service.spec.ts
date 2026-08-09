import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityAuditsGettersService } from './entity-audits-getters.service';
import { EntityAudit } from '../../entities';
import { AuditableEntityNameEnum } from '../../common/enums';

/**
 * Unit tests for {@link EntityAuditsGettersService}.
 */
describe('EntityAuditsGettersService', () => {
  const repositoryMock = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: EntityAuditsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EntityAuditsGettersService,
        {
          provide: getRepositoryToken(EntityAudit),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(EntityAuditsGettersService);
  });

  describe('findByEntity', () => {
    it('returns rows from repository.find', async () => {
      const rows = [{ id: 1 } as EntityAudit];
      repositoryMock.find.mockResolvedValue(rows);
      await expect(
        service.findByEntity('Product', 5, 20),
      ).resolves.toBe(rows);
      expect(repositoryMock.find).toHaveBeenCalledWith({
        where: { entityName: 'Product', entityId: 5 },
        relations: ['creationBusiness', 'creationUser'],
        order: { creationDate: 'DESC' },
        take: 20,
      });
    });
  });

  describe('findByDiscountProductByProductId', () => {
    it('delegates to findByEntity with DiscountProduct name', async () => {
      const rows = [{ id: 2 } as EntityAudit];
      repositoryMock.find.mockResolvedValue(rows);
      await expect(
        service.findByDiscountProductByProductId(8, 15),
      ).resolves.toBe(rows);
      expect(repositoryMock.find).toHaveBeenCalledWith({
        where: {
          entityName: AuditableEntityNameEnum.DiscountProduct,
          entityId: 8,
        },
        relations: ['creationBusiness', 'creationUser'],
        order: { creationDate: 'DESC' },
        take: 15,
      });
    });
  });

  describe('findByDiscountProductByDiscountId', () => {
    it('uses query builder and returns rows', async () => {
      const rows = [{ id: 3 } as EntityAudit];
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.findByDiscountProductByDiscountId(44, 10),
      ).resolves.toBe(rows);
      expect(repositoryMock.createQueryBuilder).toHaveBeenCalledWith('a');
      expect(qb.getMany).toHaveBeenCalled();
    });
  });
});
