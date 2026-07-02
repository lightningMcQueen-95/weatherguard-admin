import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { User, UserStatus } from '../common/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  findByProviderId(provider: string, providerId: string) {
    return this.userModel.findOne({ provider, providerId });
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  findById(id: string) {
    return this.userModel.findById(id);
  }

  async createFromOAuth(data: {
    email: string;
    name: string;
    avatarUrl?: string;
    provider: 'google' | 'github';
    providerId: string;
  }) {
    return this.userModel.create({
      ...data,
      role: 'user',
      status: 'pending',
    });
  }

  /**
   * The single read path that determines who is eligible to receive
   * weather alerts. Only `status: 'approved'` users with a linked
   * Telegram chat are returned — nothing else in the system can bypass
   * this filter, because nothing else stores alert eligibility.
   */
  findApprovedWithTelegram() {
    return this.userModel.find({
      status: 'approved',
      telegramChatId: { $exists: true, $ne: null },
    });
  }

  findPending() {
    return this.userModel.find({ status: 'pending' }).sort({ createdAt: 1 });
  }

  findAll() {
    return this.userModel.find().sort({ createdAt: -1 });
  }

  async setStatus(userId: string, status: UserStatus) {
    const user = await this.userModel.findByIdAndUpdate(userId, { status }, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setLocation(userId: string, location: { name: string; lat: number; lon: number }) {
    const user = await this.userModel.findByIdAndUpdate(userId, { location }, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Generates a fresh one-time token for the Telegram deep link
   * (t.me/<bot>?start=<token>). Any previous token is overwritten,
   * so old links can't be replayed.
   */
  async generateTelegramLinkToken(userId: string) {
    const token = randomUUID();
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { telegramLinkToken: token },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return token;
  }

  findByTelegramLinkToken(token: string) {
    return this.userModel.findOne({ telegramLinkToken: token });
  }

  /**
   * Consumes the link token and stores the chat id. The token is cleared
   * in the same update so it cannot be reused.
   */
  async attachTelegramChat(userId: string, chatId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { telegramChatId: chatId, telegramLinkToken: null },
      { new: true },
    );
  }

  async unlinkTelegram(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { telegramChatId: null },
      { new: true },
    );
  }
}
