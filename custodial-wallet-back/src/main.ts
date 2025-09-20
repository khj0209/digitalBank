import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    session({
      secret: 'wallet-secret',
      resave: false,
      saveUninitialized: true,
    }),
  );
  
  app.enableCors({
    origin: true, // 모든 Origin 허용 (보안상 운영환경에서는 특정 도메인만)
    credentials: true, // 세션 쿠키 보내려면 true 필수
  });

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
