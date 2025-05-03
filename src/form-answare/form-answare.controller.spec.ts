import { Test, TestingModule } from '@nestjs/testing';
import { FormAnswareController } from './form-answare.controller';
import { FormAnswareService } from './form-answare.service';

describe('FormAnswareController', () => {
  let controller: FormAnswareController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FormAnswareController],
      providers: [FormAnswareService],
    }).compile();

    controller = module.get<FormAnswareController>(FormAnswareController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
