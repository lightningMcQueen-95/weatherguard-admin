import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertStatus = 'sent' | 'failed';

@Schema({ timestamps: true })
export class AlertLog extends Document {
  declare _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['sent', 'failed'] })
  status: AlertStatus;

  @Prop({ type: Object })
  payload?: Record<string, any>;

  @Prop()
  error?: string;

  createdAt?: Date;
}

export const AlertLogSchema = SchemaFactory.createForClass(AlertLog);
