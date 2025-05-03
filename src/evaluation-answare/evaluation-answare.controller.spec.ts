import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationAnswareController } from './evaluation-answare.controller';
import { EvaluationAnswareService } from './evaluation-answare.service';

describe('EvaluationAnswareController', () => {
  let controller: EvaluationAnswareController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationAnswareController],
      providers: [EvaluationAnswareService],
    }).compile();

    controller = module.get<EvaluationAnswareController>(EvaluationAnswareController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
