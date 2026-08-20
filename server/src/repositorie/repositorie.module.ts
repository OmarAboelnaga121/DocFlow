import { Module } from '@nestjs/common';
import { RepositorieController } from './repositorie.controller';
import { RepositorieService } from './repositorie.service';

@Module({
  controllers: [RepositorieController],
  providers: [RepositorieService]
})
export class RepositorieModule {}
