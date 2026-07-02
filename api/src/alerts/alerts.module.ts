import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AlertsProcessor, ALERTS_QUEUE } from "./alerts.processor";
import { AlertsScheduler } from "./alerts.scheduler";
import { AlertsController } from "./alerts.controller";
import { AlertLog, AlertLogSchema } from "../common/schemas/alert-log.schema";
import { UsersModule } from "../users/users.module";
import { WeatherModule } from "../weather/weather.module";
import { TelegramModule } from "../telegram/telegram.module";

@Module({
  imports: [
    UsersModule,
    WeatherModule,
    TelegramModule,
    MongooseModule.forFeature([
      { name: AlertLog.name, schema: AlertLogSchema },
    ]),
    BullModule.registerQueueAsync({
      name: ALERTS_QUEUE,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: config.get("REDIS_URL")
          ? { url: config.get("REDIS_URL") }
          : {
              host: config.get("REDIS_HOST") || "localhost",
              port: config.get<number>("REDIS_PORT") || 6379,
            },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AlertsController],
  providers: [AlertsProcessor, AlertsScheduler],
})
export class AlertsModule {}
