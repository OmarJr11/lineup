import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { CatalogsSettersService } from './catalogs-setters.service';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import { Catalog } from '../../entities';
import { QueueNamesEnum } from '../../common/enums/consumers';

/**
 * Unit tests for {@link CatalogsSettersService} (pure helpers and wiring).
 */
describe('CatalogsSettersService', () => {
  const repositoryMock = {
    metadata: { columns: [{ propertyName: 'id' }] },
  };
  const entityAuditsQueueServiceMock = {
    addRecordJob: jest.fn(),
  };
  const catalogsQueueMock = {
    add: jest.fn(),
  };
  let service: CatalogsSettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogsSettersService,
        {
          provide: getRepositoryToken(Catalog),
          useValue: repositoryMock,
        },
        {
          provide: EntityAuditsQueueService,
          useValue: entityAuditsQueueServiceMock,
        },
        {
          provide: getQueueToken(QueueNamesEnum.catalogs),
          useValue: catalogsQueueMock,
        },
      ],
    }).compile();
    service = moduleRef.get(CatalogsSettersService);
  });

  describe('generatePathFromTitle', () => {
    it('slugifies title with accents and spaces', () => {
      expect(service.generatePathFromTitle('Café  Shop')).toBe('cafe-shop');
    });
  });
});
