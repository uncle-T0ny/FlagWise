import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { CerebrasModule } from '../cerebras/cerebras.module';

@Module({
  imports: [CerebrasModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
