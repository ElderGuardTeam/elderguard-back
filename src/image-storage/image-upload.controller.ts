import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ImageStorageService } from './image-storage.service';

@Controller('upload')
export class ImageUploadController {
  constructor(private readonly imageStorageService: ImageStorageService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      // 1. Configuração de Armazenamento
      storage: diskStorage({
        destination: './uploads', // O diretório onde os arquivos serão salvos
        filename: (req, file, callback) => {
          // 2. Geração do Nome do Arquivo
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname); // Extrai a extensão do arquivo
          const filename = `${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      // 3. Filtro de Arquivos (opcional, mas muito recomendado)
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          // Rejeita o arquivo se não for uma imagem
          return callback(
            new Error('Apenas arquivos de imagem são permitidos!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    // A lógica de salvar já foi tratada pelo interceptor.
    // Agora, apenas retornamos uma resposta para o cliente.
    return this.imageStorageService.handleFileUpload(file);
  }
}
