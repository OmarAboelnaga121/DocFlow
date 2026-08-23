import { Module } from '@nestjs/common';
import { RepositoryController } from './repository.controller';
import { RepositoryService } from './repository.service';
import { RepoAnalysisModule } from './repo-analysis/repo-analysis.module';

@Module({
  controllers: [RepositoryController],
  providers: [RepositoryService],
  imports: [RepoAnalysisModule]
})
export class RepositoryModule {}
