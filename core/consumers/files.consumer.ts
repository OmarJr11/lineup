import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FilesConsumerEnum, QueueNamesEnum } from '../common/enums';
import { FilesSettersService } from '../modules/files/files-setters.service';
import { Logger } from '@nestjs/common';

@Processor(QueueNamesEnum.files)
export class FilesConsumer extends WorkerHost {
  private readonly logger = new Logger(FilesConsumer.name);

  constructor(private readonly filesSettersService: FilesSettersService) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case FilesConsumerEnum.GenerateCopies:
        await this.generateCopies(job);
        break;
    }
    return {};
  }

  private async generateCopies(job: Job): Promise<void> {
    const {
      bucket,
      key,
      body,
      contentType,
      metadata,
      resolution,
      url,
      fileKey,
    } = job.data;
    await this.filesSettersService.updateFile(
      bucket,
      key,
      body,
      contentType,
      metadata,
      resolution,
      url,
      fileKey,
    );
  }
}
