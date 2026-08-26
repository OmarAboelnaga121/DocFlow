import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Cookie Parser Middleware
  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';
  const allowedOrigins = frontendUrl.includes(',')
    ? frontendUrl.split(',').map((url) => url.trim())
    : frontendUrl;

  // Enable CORS with credentials for cookies
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // 3. Helmet Security Middleware — disable the two policies that conflict
  //    with cross-origin API access from the browser.
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginOpenerPolicy: false,
    }),
  );

  // 2. Class Validator & Class Transformer Global Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 3. Swagger OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('DocFlow API')
    .setDescription('DocFlow Backend API documentation')
    .setVersion('1.0')
    .addCookieAuth('token')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
}
bootstrap();


