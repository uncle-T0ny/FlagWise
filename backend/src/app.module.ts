import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommunityModule } from './community/community.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    CommunityModule,
  ],
})
export class AppModule {}
