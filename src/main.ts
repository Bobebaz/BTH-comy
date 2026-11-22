import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const PORT = 3003;
  await app.listen(PORT);
  console.log(`Report Service đang chạy độc lập tại: http://localhost:${PORT}/reports`);
}
bootstrap();