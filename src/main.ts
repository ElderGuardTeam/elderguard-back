/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  const config = new DocumentBuilder()
    .setTitle('ElderGuard API')
    .setDescription(
      'Documentação completa da API do sistema ElderGuard para gerenciamento de avaliações de idosos.',
    )
    .setVersion('1.0')
    .addTag('Autenticação', 'Endpoints para login e gerenciamento de sessão')
    .addTag('Usuários', 'Operações relacionadas aos usuários do sistema')
    .addTag('Idosos', 'Operações relacionadas ao cadastro de idosos')
    .addTag(
      'Profissionais',
      'Operações relacionadas aos profissionais de saúde',
    )
    .addTag(
      'Avaliações',
      'Gerenciamento dos modelos de avaliação (formulários)',
    )
    .addTag(
      'Respostas de Avaliações',
      'Gerenciamento das avaliações respondidas',
    )
    .addTag('Seções', 'Gerenciamento das seções dos formulários')
    .addTag('Questões', 'Gerenciamento das questões dos formulários')
    .addTag('Opções', 'Gerenciamento das opções de resposta das questões')
    .addTag('Regras', 'Gerenciamento das regras de pontuação e resultado')
    .addTag('Endereços', 'Operações CRUD para endereços')
    .addTag('Contatos', 'Operações CRUD para contatos')
    .addTag('Upload de Imagens', 'Endpoints para upload de imagens')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entre com o token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'ElderGuard API Docs',
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
