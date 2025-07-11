import { Test, TestingModule } from '@nestjs/testing';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';

describe('BusinessesController', () => {
  let businessesController: BusinessesController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BusinessesController],
      providers: [BusinessesService],
    }).compile();

    businessesController = app.get<BusinessesController>(BusinessesController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(businessesController.getHello()).toBe('Hello World!');
    });
  });
});
