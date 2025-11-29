import { Module } from '@nestjs/common';
import { CerebrasService } from './cerebras.service';

@Module({
  providers: [CerebrasService],
  exports: [CerebrasService],
})
export class CerebrasModule {}
