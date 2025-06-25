/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageStorageService {
  private readonly UPLOADS_DIR = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.UPLOADS_DIR)) {
      fs.mkdirSync(this.UPLOADS_DIR, { recursive: true });
    }
  }

  handleFileUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado.');
    }

    return {
      message: 'Upload de imagem bem-sucedido!',
      filePath: `/uploads/${file.filename}`,
    };
  }

  async saveBase64Image(
    base64String: string,
    filenamePrefix?: string,
  ): Promise<{ message: string; filePath: string }> {
    if (!base64String) {
      throw new BadRequestException('Nenhuma string base64 fornecida.');
    }

    const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new BadRequestException('Formato de string base64 inválido.');
    }

    const mimeType = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    if (!mimeType.startsWith('image/')) {
      throw new BadRequestException(
        'Apenas arquivos de imagem são permitidos!',
      );
    }

    const ext = mimeType.split('/')[1];
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = `${filenamePrefix || 'image'}-${uniqueSuffix}.${ext}`;
    const filePath = path.join(this.UPLOADS_DIR, filename);
    const publicPath = `/uploads/${filename}`;

    try {
      await fs.promises.writeFile(filePath, buffer);
      return {
        message: 'Upload de imagem base64 bem-sucedido!',
        filePath: publicPath,
      };
    } catch (error) {
      throw new BadRequestException(
        `Erro ao salvar a imagem: ${error.message}`,
      );
    }
  }
}
