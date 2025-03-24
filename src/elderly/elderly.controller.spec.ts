import { Test, TestingModule } from '@nestjs/testing';
import { ElderlyController } from './elderly.controller';
import { ElderlyService } from './elderly.service';

describe('ElderlyController', () => {
  let controller: ElderlyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElderlyController],
      providers: [ElderlyService],
    }).compile();

    controller = module.get<ElderlyController>(ElderlyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
