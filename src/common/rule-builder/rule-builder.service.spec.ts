import { Test, TestingModule } from '@nestjs/testing';
import { RuleBuilderService } from './rule-builder.service';

describe('RuleBuilderService', () => {
  let service: RuleBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RuleBuilderService],
    }).compile();

    service = module.get<RuleBuilderService>(RuleBuilderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
