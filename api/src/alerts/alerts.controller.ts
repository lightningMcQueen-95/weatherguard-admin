import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Queue } from 'bullmq';
import { Model } from 'mongoose';
import { ALERTS_QUEUE } from './alerts.processor';
import { AlertLog } from '../common/schemas/alert-log.schema';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AlertsController {
  constructor(
    @InjectQueue(ALERTS_QUEUE) private queue: Queue,
    @InjectModel(AlertLog.name) private alertLogModel: Model<AlertLog>,
  ) {}

  @Post('run-now')
  triggerNow() {
    return this.queue.add('sweep', {}, { removeOnComplete: true });
  }

  @Get('logs')
  getLogs() {
    return this.alertLogModel.find().sort({ createdAt: -1 }).limit(100).populate('userId', 'name email');
  }
}
