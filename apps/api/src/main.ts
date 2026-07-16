import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Seguridad ──────────────────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ── Rendimiento ────────────────────────────────────────
  app.use(compression());

  // ── Validación global de DTOs ──────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // Strip propiedades no declaradas en DTO
      forbidNonWhitelisted: true,  // Error si se envían props no permitidas
      transform: true,             // Auto-transform payload a tipos TS
    }),
  );

  // ── Prefijo global ─────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Swagger (docs en /docs) ────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Dream Life API')
      .setDescription('API REST para la plataforma Dream Life')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    console.log(`📚 Swagger disponible en http://localhost:${process.env.PORT || 3001}/docs`);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 API corriendo en http://localhost:${port}/api/v1`);
}

bootstrap();
