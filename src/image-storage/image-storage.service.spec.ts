import { Test, TestingModule } from '@nestjs/testing';
import { ImageStorageService } from './image-storage.service';

describe('ImageStorageService', () => {
  let service: ImageStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageStorageService],
    }).compile();

    service = module.get<ImageStorageService>(ImageStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
