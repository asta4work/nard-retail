import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api');
  const corsOrigins = config.get<string>('CORS_ORIGIN', 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  app.useGlobalFilters(new ApiExceptionFilter());

  if (config.get<string>('SWAGGER_ENABLED', 'true').toLowerCase() !== 'false') {
    const swaggerPath = config.get<string>('SWAGGER_PATH', 'docs').replace(/^\/+|\/+$/g, '');
    const swaggerConfig = new DocumentBuilder()
      .setTitle(config.get('SWAGGER_TITLE', 'RetailOps API'))
      .setDescription(config.get('SWAGGER_DESCRIPTION', 'Inventory, sales, reporting, and user management API'))
      .setVersion(config.get('SWAGGER_VERSION', '1.0'))
      .addBearerAuth()
      .build();
    SwaggerModule.setup(`api/${swaggerPath}`, app, SwaggerModule.createDocument(app, swaggerConfig));
    Logger.log(`Swagger available at /api/${swaggerPath}`, 'Bootstrap');
  }

  const port = config.get<number>('BACKEND_PORT', config.get<number>('PORT', 3000));
  const host = config.get<string>('BACKEND_HOST', config.get<string>('HOST', '0.0.0.0'));
  await app.listen(port, host);
  Logger.log(`Backend listening on http://${host}:${port}`, 'Bootstrap');
}

bootstrap();
