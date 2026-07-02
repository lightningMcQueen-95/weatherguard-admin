import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import * as cookieParser from "cookie-parser";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: config.get("ADMIN_URL"),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = config.get("PORT") || 3000;
  await app.listen(port);
  console.log(`WeatherGuard API listening on port ${port}`);
}

bootstrap();
