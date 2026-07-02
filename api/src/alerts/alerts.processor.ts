import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UsersService } from "../users/users.service";
import { WeatherService } from "../weather/weather.service";
import { TelegramService } from "../telegram/telegram.service";
import { AlertLog } from "../common/schemas/alert-log.schema";

export const ALERTS_QUEUE = "alerts";

@Processor(ALERTS_QUEUE)
export class AlertsProcessor extends WorkerHost {
  private readonly logger = new Logger(AlertsProcessor.name);

  constructor(
    private usersService: UsersService,
    private weatherService: WeatherService,
    private telegramService: TelegramService,
    @InjectModel(AlertLog.name) private alertLogModel: Model<AlertLog>
  ) {
    super();
  }

  /**
   * This is the only place alerts are actually dispatched. It re-queries
   * approved + linked users at run time (never relies on a cached list),
   * so a user revoked between scheduling and execution is automatically
   * excluded.
   */
  async process(job: Job): Promise<any> {
    this.logger.log("Running scheduled weather alert sweep");

    const users = await this.usersService.findApprovedWithTelegram();

    for (const user of users) {
      if (!user.location) continue;

      try {
        const weather = await this.weatherService.getCurrent(
          user.location.lat,
          user.location.lon
        );

        if (false && !weather.alertWorthy) continue; // TEMP: send for all weather

        const message = this.formatAlert(user.location.name, weather);
        await this.telegramService.sendAlert(user.telegramChatId!, message);

        await this.alertLogModel.create({
          userId: user._id,
          status: "sent",
          payload: weather.raw,
        });
      } catch (err: any) {
        this.logger.error(`Failed to alert user ${user._id}: ${err.message}`);
        await this.alertLogModel.create({
          userId: user._id,
          status: "failed",
          error: err.message,
        });
      }
    }

    return { processed: users.length };
  }

  private formatAlert(locationName: string, weather: any) {
    return (
      `⚠️ *Weather Alert for ${locationName}*\n\n` +
      `${weather.condition}\n` +
      `Temperature: ${weather.temperatureC}°C\n` +
      `Wind: ${weather.windSpeedKph} km/h`
    );
  }
}
