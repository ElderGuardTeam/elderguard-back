import { Test, TestingModule } from '@nestjs/testing';
import { ElderlyService } from './elderly.service';

describe('ElderlyService', () => {
  let service: ElderlyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElderlyService],
    }).compile();

    service = module.get<ElderlyService>(ElderlyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
