import { Test, TestingModule } from '@nestjs/testing';
import { FormAnswareService } from './form-answare.service';

describe('FormAnswareService', () => {
  let service: FormAnswareService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormAnswareService],
    }).compile();

    service = module.get<FormAnswareService>(FormAnswareService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
