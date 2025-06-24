/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';

@Injectable()
export class ImageStorageService {
  // Este serviço poderia ter lógicas mais complexas no futuro,
  // como redimensionar imagens, comprimir, etc.
  // Por enquanto, ele apenas confirma o sucesso do upload.
  handleFileUpload(file: Express.Multer.File) {
    if (!file) {
      throw new Error('Nenhum arquivo enviado.');
    }

    // Retorna o caminho parcial que o front-end usará para acessar a imagem.
    // Ex: /uploads/imagem-1678886400000.png
    return {
      message: 'Upload de imagem bem-sucedido!',
      filePath: `/uploads/${file.filename}`,
    };
  }
}
