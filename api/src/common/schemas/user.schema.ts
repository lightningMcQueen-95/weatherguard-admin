import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'user' | 'admin';
export type AuthProvider = 'google' | 'github';

@Schema({ timestamps: true })
export class User extends Document {
  declare _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ required: true, enum: ['google', 'github'] })
  provider: AuthProvider;

  // The unique ID returned by the OAuth provider (Google `sub`, GitHub `id`)
  @Prop({ required: true })
  providerId: string;

  @Prop({ required: true, enum: ['user', 'admin'], default: 'user' })
  role: UserRole;

  // The single source of truth for "can this user receive alerts".
  // Every alert-eligibility query filters on this field directly.
  @Prop({ required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: UserStatus;

  // Populated once the user completes the Telegram deep-link flow.
  @Prop()
  telegramChatId?: string;

  // One-time token embedded in the /start deep link. Cleared once consumed
  // so it can never be reused or replayed.
  @Prop()
  telegramLinkToken?: string;

  @Prop({
    type: {
      name: { type: String },
      lat: { type: Number },
      lon: { type: Number },
    },
  })
  location?: {
    name: string;
    lat: number;
    lon: number;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
