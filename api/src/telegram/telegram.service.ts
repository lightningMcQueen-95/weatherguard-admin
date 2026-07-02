import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { UsersService } from '../users/users.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf;

  constructor(
    private config: ConfigService,
    private usersService: UsersService,
  ) {
    this.bot = new Telegraf(this.config.get<string>('TELEGRAM_BOT_TOKEN', ''));
  }

  onModuleInit() {
    // Handles: t.me/<bot>?start=<token>
    // Telegram passes the deep-link payload as the argument to /start.
    this.bot.start(async (ctx) => {
      const token = ctx.startPayload;
      const chatId = ctx.chat.id.toString();

      if (!token) {
        return ctx.reply(
          "Hi! To link your account, request access on the WeatherGuard dashboard and use the 'Connect Telegram' button there.",
        );
      }

      const user = await this.usersService.findByTelegramLinkToken(token);

      if (!user) {
        return ctx.reply(
          'This link is invalid or has already been used. Please generate a new one from the dashboard.',
        );
      }

      await this.usersService.attachTelegramChat(user._id.toString(), chatId);

      const message =
        user.status === 'approved'
          ? "You're all set! Your Telegram is linked and you'll receive weather alerts here once they're scheduled."
          : "Your Telegram is linked. You'll start receiving alerts here as soon as an admin approves your access request.";

      return ctx.reply(message);
    });

    this.bot.launch();
    this.logger.log('Telegram bot launched');
  }

  async sendAlert(chatId: string, text: string) {
    await this.bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  }
}
