import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationAnswareService } from './evaluation-answare.service';

describe('EvaluationAnswareService', () => {
  let service: EvaluationAnswareService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EvaluationAnswareService],
    }).compile();

    service = module.get<EvaluationAnswareService>(EvaluationAnswareService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
