import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ALERTS_QUEUE } from './alerts.processor';

@Injectable()
export class AlertsScheduler implements OnModuleInit {
  constructor(@InjectQueue(ALERTS_QUEUE) private queue: Queue) {}

  async onModuleInit() {
    // Runs every 30 minutes. Adjust the cron pattern as needed —
    // this just needs to be frequent enough to catch changing conditions.
    await this.queue.add(
      'sweep',
      {},
      {
        repeat: { pattern: '*/30 * * * *' },
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
  }
}
